"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Package,
  CreditCard,
  MapPin,
  FileText,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useAuth, useOrder } from "@/lib/hooks";
import { ordersAPI } from "@/lib/api/orders";
import BrandedSpinner from "@/components/common/BrandedSpinner";
import StatusBadge from "@/components/common/StatusBadge";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { CURRENCY, DELIVERY_FEE } from "@/lib/utils/constants";
import { toast } from "sonner";
import Breadcrumbs from "@/components/common/BreadCrumbs";
import Title from "@/components/common/Title";

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const orderReference = params.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const { order: fetchedOrder, isLoading, error } = useOrder(
    orderReference,
    isAuthenticated
  );

  useEffect(() => {
    if (fetchedOrder) {
      setOrder(fetchedOrder);
    }
  }, [fetchedOrder]);

  const checkPaymentStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const paymentStatus = await ordersAPI.getPaymentStatus(orderReference);
      toast.success(`Payment status updated: ${paymentStatus}`);

      setOrder((prev: any) => ({
        ...prev,
        payment: paymentStatus,
      }));
    } catch (error) {
      console.error("Status check error:", error);
      toast.error("Failed to check payment status");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const downloadDocument = async (docType: string) => {
    try {
      toast.loading(`Generating ${docType}...`);

      const response = await ordersAPI.downloadPaymentDocument(orderReference, docType);
      const blob =
        response instanceof Blob
          ? response
          : new Blob([response], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${docType}_${orderReference}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${docType} downloaded successfully!`);
    } catch (error) {
      console.error(`Error downloading ${docType}:`, error);
      toast.error(`Could not download ${docType}`);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/orders");
      return;
    }
  }, [isAuthenticated, orderReference, router]);

  useEffect(() => {
    if (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load order details";
      toast.error(message);
    }
  }, [error]);

  const getPaymentStatus = () => {
    if (!order) return "Unknown";
    if (order.payment === "Success" || order.payment === "success") return "Paid";
    if (order.payment === "Failed" || order.payment === "failed") return "Failed";
    if (order.payment === "Pending" || order.payment === "pending") return "Processing";
    if (order.payment === "Cancelled" || order.payment === "cancelled") return "Cancelled";
    if (order.payment === "refunded") return "Refunded";
    return "Unpaid";
  };

  const canViewInvoice = () => {
    if (!order) return false;
    return ["Order Placed", "Packing", "Shipped", "Out for Delivery"].includes(order.status);
  };

  const canViewReceipt = () => {
    if (!order) return false;
    return order.status === "Delivered" && getPaymentStatus() === "Paid";
  };

  const calculateOrderTotal = () => {
    if (!order?.items) return 0;
    return order.items.reduce(
      (total: number, item: any) => total + item.price * item.quantity,
      0
    );
  };

  const getTimeline = () => {
    const statuses = [
      "Order Placed",
      "Packing",
      "Shipped",
      "Out for Delivery",
      "Delivered",
    ];

    const currentIndex = statuses.indexOf(order?.status || "");

    return statuses.map((status, index) => ({
      status,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  if (isLoading) {
    return <BrandedSpinner message="Loading order details..." />;
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 text-center">
        <p className="text-error mb-4">Order not found</p>
        <Link href="/orders">
          <button className="bg-accent text-bg px-6 py-3 rounded-full hover:bg-bg hover:text-accent border border-transparent hover:border-accent transition-all">
            Back to Orders
          </button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Breadcrumbs />
      <div className="pt-4 pb-16">
        <div className="container mx-auto max-w-5xl">
          {/* Page Header */}
          <div className="mb-8 text-center text-2xl sm:text-3xl">
            <Title text1="ORDER" text2="DETAILS" />
            <p className="text-secondary w-3/4 m-auto text-sm sm:text-base mx-auto">
              Track and manage your order
            </p>
          </div>

          {/* Order Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Order #{order.order_reference || orderReference}
            </h1>
            <p className="text-secondary">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
          {/* Payment Success Alert */}
          {getPaymentStatus() === "Paid" && order.payment_method === "MPESA" && (
            <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-success mt-0.5 shrink-0" size={20} />
                <div className="grow">
                  <h4 className="font-medium text-success mb-2">Payment Successful</h4>
                  <p className="text-success/90 text-sm mb-3">
                    Your M-Pesa payment has been completed successfully.
                  </p>
                  {order.transaction_id && (
                    <div className="p-3 bg-success/20 rounded">
                      <p className="text-success text-sm">
                        <span className="font-medium">Transaction ID:</span>{" "}
                        {order.transaction_id}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Payment Failure Alert */}
          {getPaymentStatus() === "Failed" && (
            <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-error mt-0.5 shrink-0" size={20} />
                <div className="grow">
                  <h4 className="font-medium text-error mb-2">Payment Failed</h4>
                  <p className="text-error/90 text-sm mb-3">
                    Your payment could not be completed.
                  </p>
                  {order.failure_reason && (
                    <div className="p-3 bg-error/20 rounded mb-3">
                      <p className="text-error text-sm">
                        <span className="font-medium">Reason:</span> {order.failure_reason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Order Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-accent" />
                <h4 className="font-medium">Order Date</h4>
              </div>
              <p className="text-secondary">{formatDate(order.created_at)}</p>
            </div>
            <div className="p-4 bg-bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Package size={16} className="text-accent" />
                <h4 className="font-medium">Order Status</h4>
              </div>
              <StatusBadge status={order.status} type="order" />
            </div>
            <div className="p-4 bg-bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={16} className="text-accent" />
                <h4 className="font-medium">Payment</h4>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={getPaymentStatus()} type="payment" />
                <span className="text-secondary text-sm">{order.payment_method}</span>
              </div>
              {order.payment_method !== "COD" && getPaymentStatus() === "Processing" && (
                <button
                  onClick={checkPaymentStatus}
                  disabled={isCheckingStatus}
                  className="text-xs mt-2 px-3 py-1 bg-bg text-accent border border-accent rounded hover:bg-accent hover:text-bg disabled:opacity-50 transition-all"
                >
                  {isCheckingStatus ? "Checking..." : "Check Status"}
                </button>
              )}
            </div>
          </div>
          {/* Order Timeline */}
          <div className="mb-8 bg-bg-card rounded-lg border border-border p-6">
            <h4 className="font-medium mb-4">Order Timeline</h4>
            <div className="flex items-start justify-between gap-2">
              {getTimeline().map((step, index) => (
                <div key={index} className="flex flex-col items-center text-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${step.current
                      ? "bg-accent"
                      : step.completed
                        ? "bg-success"
                        : "bg-border"
                      }`}
                  >
                    {step.completed && !step.current && (
                      <svg
                        className="w-4 h-4 text-bg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <p
                    className={`text-xs mt-2 ${step.current
                      ? "text-accent font-medium"
                      : step.completed
                        ? "text-success"
                        : "text-secondary"
                      }`}
                  >
                    {step.status}
                  </p>
                </div>
              ))}
            </div>
          </div>
          {/* Shipping Address */}
          {order.address && (
            <div className="mb-8 bg-bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={16} className="text-accent" />
                <h4 className="font-medium">Shipping Address</h4>
              </div>
              <p className="font-medium">
                {order.address.first_name} {order.address.last_name}
              </p>
              <p className="text-secondary text-sm mt-1">{order.address.street}</p>
              <p className="text-secondary text-sm">{order.address.city}</p>
              {order.address.phone && (
                <p className="text-secondary text-sm mt-1">Phone: {order.address.phone}</p>
              )}
              {order.address.email && (
                <p className="text-secondary text-sm">Email: {order.address.email}</p>
              )}
            </div>
          )}
          {/* Order Items */}
          <div className="mb-8 bg-bg-card rounded-lg border border-border overflow-hidden">
            <h4 className="font-medium p-6 border-b border-border">Order Items</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-bg-light text-sm text-secondary">
                    <th className="text-left p-4 font-medium">Product</th>
                    <th className="text-center p-4 font-medium">Price</th>
                    <th className="text-center p-4 font-medium">Quantity</th>
                    <th className="text-right p-4 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item: any, index: number) => (
                    <tr
                      key={index}
                      className={`${index !== order.items.length - 1 ? "border-b border-border" : ""
                        }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded border border-border"
                          />
                          <div>
                            <h5 className="font-medium">{item.name}</h5>
                            {item.variation_name && (
                              <p className="text-secondary text-sm">
                                Variation: {item.variation_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-center p-4">
                        {CURRENCY} {formatPrice(item.price)}
                      </td>
                      <td className="text-center p-4">{item.quantity}</td>
                      <td className="text-right p-4 font-medium">
                        {CURRENCY} {formatPrice(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Order Total */}
            <div className="p-6 bg-bg-light border-t border-border">
              <div className="flex justify-between mb-2">
                <span className="text-secondary">Subtotal:</span>
                <span>
                  {CURRENCY} {formatPrice(calculateOrderTotal())}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-secondary">Shipping:</span>
                <span>
                  {CURRENCY} {formatPrice(DELIVERY_FEE)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border mt-2">
                <span className="font-medium">Total:</span>
                <span className="font-bold text-accent">
                  {CURRENCY} {formatPrice(calculateOrderTotal() + DELIVERY_FEE)}
                </span>
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-end">
            {canViewInvoice() && (
              <button
                onClick={() => downloadDocument("invoice")}
                className="flex items-center border border-info bg-bg text-info px-4 py-2 text-sm font-medium rounded-md hover:bg-info hover:text-bg transition-all"
              >
                <FileText size={14} className="mr-2" />
                Download Invoice
              </button>
            )}
            {canViewReceipt() && (
              <button
                onClick={() => downloadDocument("receipt")}
                className="flex items-center border border-success bg-bg text-success px-4 py-2 text-sm font-medium rounded-md hover:bg-success hover:text-bg transition-all"
              >
                <FileText size={14} className="mr-2" />
                Download Receipt
              </button>
            )}
            <Link href="/orders">
              <button className="flex gap-2 border border-border bg-bg text-primary px-4 py-2 text-sm font-medium rounded-md hover:bg-bg-light transition-all">
                <ArrowLeft size={20} />
                Back to Orders
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
