"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, RefreshCcw } from "lucide-react";
import { useAuth, useOrders } from "@/lib/hooks";
import BrandedSpinner from "@/components/common/BrandedSpinner";
import Title from "@/components/common/Title";
import OrderStats from "@/components/orders/OrderStats";
import OrderCard from "@/components/orders/OrderCard";
import { toast } from "sonner";

interface GroupedOrder {
  id: string | number;
  order_reference?: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  paymentMethod: string;
  payment: string;
  failure_reason?: string;
  checkout_request_id?: string;
  address: any;
  items: any[];
}

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { orders, isLoading, error, refetch } = useOrders(isAuthenticated);
  const isError = Boolean(error);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/orders");
      return;
    }
  }, [isAuthenticated, router]);

  const orderData = useMemo(() => {
    const sortedOrders = [...(orders as any[])].sort(
      (a: any, b: any) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    const allOrderItems: any[] = [];

    sortedOrders.forEach((order: any) => {
      const orderAddress = order.address;

      order.items.forEach((item: any) => {
        item.status = order.status;
        item.payment = order.payment;
        item.failure_reason = order.failure_reason;
        item.checkout_request_id = order.checkout_request_id;
        item.paymentMethod = order.payment_method;
        item.created_at = order.created_at;
        item.updated_at = order.updated_at;
        item.orderId = order.order_reference || order.id;
        item.order_reference = order.order_reference || order.id;
        item.product_id = item.product_id;
        item.address = orderAddress;
        item.review = item.review || null;
        allOrderItems.push(item);
      });
    });

    return allOrderItems;
  }, [orders]);

  const getGroupedOrders = (): GroupedOrder[] => {
    const groupedOrders: { [key: string]: GroupedOrder } = {};

    orderData.forEach((item) => {
      if (!groupedOrders[item.orderId]) {
        groupedOrders[item.orderId] = {
          id: item.orderId,
          order_reference: item.order_reference,
          created_at: item.created_at,
          updated_at: item.updated_at,
          status: item.status,
          paymentMethod: item.paymentMethod,
          payment: item.payment,
          failure_reason: item.failure_reason,
          checkout_request_id: item.checkout_request_id,
          address: item.address,
          items: [],
        };
      }
      groupedOrders[item.orderId].items.push(item);
    });

    return Object.values(groupedOrders);
  };

  const getOrderStats = () => {
    const groupedOrders = getGroupedOrders();

    const getPaymentStatus = (order: GroupedOrder) => {
      if (order.payment === "Success" || order.payment === "success") return "Paid";
      if (order.payment === "Failed" || order.payment === "failed") return "Failed";
      if (order.payment === "Pending" || order.payment === "pending") return "Processing";
      if (order.payment === "Cancelled" || order.payment === "cancelled") return "Cancelled";
      return "Unpaid";
    };

    return {
      total: groupedOrders.length,
      processing: groupedOrders.filter(
        (order) =>
          order.status !== "Delivered" &&
          order.status !== "Order Placed" &&
          getPaymentStatus(order) !== "Failed"
      ).length,
      delivered: groupedOrders.filter((order) => order.status === "Delivered").length,
      failed: groupedOrders.filter((order) => {
        const paymentStatus = getPaymentStatus(order);
        return paymentStatus === "Failed" || paymentStatus === "Cancelled";
      }).length,
      totalItems: orderData.length,
    };
  };

  const handleTrackOrder = () => {
    void refetch();
    toast.success("Order status refreshed");
  };

  if (isLoading) {
    return <BrandedSpinner message="Loading your orders..." />;
  }

  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center min-h-100 text-center pt-8">
        <h2 className="text-2xl mb-4">Something went wrong</h2>
        <p className="text-secondary mb-6">We couldn't load your order information</p>
        <button
          onClick={() => void refetch()}
          className="flex items-center bg-accent text-bg px-6 py-3 rounded-full hover:bg-bg hover:text-accent border border-transparent hover:border-accent transition-all"
        >
          <RefreshCcw size={18} className="mr-2" />
          Try Again
        </button>
      </div>
    );
  }

  const groupedOrders = getGroupedOrders();

  return (
    <div className="pt-6 pb-16">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8 text-center text-2xl sm:text-3xl">
          <Title text1="MY" text2="ORDERS" />
          <p className="text-secondary w-3/4 m-auto text-sm sm:text-base mx-auto">
            Track and manage your order history
          </p>
        </div>

        {orderData.length === 0 ? (
          <div className="text-center py-12 bg-bg-card rounded-xl p-6 border border-border shadow-md">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">No orders yet</h3>
            <p className="text-secondary text-sm mb-8">
              Start shopping to see your orders here
            </p>
            <Link href="/collection">
              <button className="bg-accent text-bg px-8 py-3 rounded-full hover:bg-bg hover:text-accent border border-transparent hover:border-accent transition-all">
                Browse Products
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Stats */}
            <OrderStats stats={getOrderStats()} />

            {/* Orders List */}
            <div className="space-y-6">
              {groupedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onTrack={handleTrackOrder}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
