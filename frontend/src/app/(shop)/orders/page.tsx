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
import { Order } from "@/lib/types/order";
import { toast } from "sonner";

interface GroupedOrder {
  id: string | number;
  order_reference?: string | number | null;
  created_at: string;
  updated_at: string;
  status: string;
  paymentMethod: string;
  payment: string;
  failure_reason?: string;
  checkout_request_id?: string;
  address?: OrderAddress | null;
  items: EnrichedOrderItem[];
}

interface OrderAddress {
  first_name?: string;
  last_name?: string;
  street?: string;
  city?: string;
  phone?: string;
  email?: string;
  [key: string]: unknown;
}

interface OrderListItem {
  id?: string | number;
  product_id?: string | number;
  image_url: string;
  name: string;
  brand?: string;
  variation_name?: string | null;
  quantity: number;
  price: number;
  review?: unknown;
  [key: string]: unknown;
}

interface OrderListEntry {
  id: string | number;
  order_reference?: string | number | null;
  created_at: string;
  updated_at: string;
  status: string;
  payment: string;
  payment_method: string;
  failure_reason?: string;
  checkout_request_id?: string;
  address?: OrderAddress | null;
  items: OrderListItem[];
}

interface EnrichedOrderItem extends OrderListItem {
  status: string;
  payment: string;
  failure_reason?: string;
  checkout_request_id?: string;
  paymentMethod: string;
  created_at: string;
  updated_at: string;
  orderId: string | number;
  order_reference: string | number;
  address?: OrderAddress | null;
}

const normalizePayment = (order: Order) => {
  if (order.payment && typeof order.payment === "object") {
    return {
      payment: order.payment.status ?? "Unknown",
      paymentMethod: order.payment.method ?? order.payment_method ?? "Unknown",
      failure_reason:
        (typeof order.payment.failure_reason === "string"
          ? order.payment.failure_reason
          : undefined) ?? (order.failure_reason ?? undefined),
      checkout_request_id:
        (typeof order.payment.checkout_request_id === "string"
          ? order.payment.checkout_request_id
          : undefined) ?? (order.checkout_request_id ?? undefined),
    };
  }

  return {
    payment: typeof order.payment === "string" ? order.payment : "Unknown",
    paymentMethod: order.payment_method ?? "Unknown",
    failure_reason: order.failure_reason ?? undefined,
    checkout_request_id: order.checkout_request_id ?? undefined,
  };
};

const normalizeOrderEntry = (order: Order): OrderListEntry => {
  const paymentData = normalizePayment(order);

  return {
    id: order.id,
    order_reference: order.order_reference ?? order.id,
    created_at: order.created_at ?? "",
    updated_at: order.updated_at ?? order.created_at ?? "",
    status: order.status,
    payment: paymentData.payment,
    payment_method: paymentData.paymentMethod,
    failure_reason: paymentData.failure_reason,
    checkout_request_id: paymentData.checkout_request_id,
    address: order.address ?? null,
    items: order.items.map((item) => ({
      id: item.id,
      product_id: item.product_id,
      image_url: item.image_url ?? "/assets/logo.png",
      name: item.name ?? `Product #${item.product_id}`,
      brand: item.brand,
      variation_name: item.variation_name ?? null,
      quantity: item.quantity,
      price: item.price ?? item.variation_price ?? 0,
      review: null,
    })),
  };
};

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
    const normalizedOrders = orders.map(normalizeOrderEntry);
    const sortedOrders = [...normalizedOrders].sort(
      (a, b) =>
        new Date(b.updated_at || b.created_at).getTime() -
        new Date(a.updated_at || a.created_at).getTime()
    );

    const allOrderItems: EnrichedOrderItem[] = [];

    sortedOrders.forEach((order) => {
      const orderAddress = order.address;

      order.items.forEach((item) => {
        allOrderItems.push({
          ...item,
          status: order.status,
          payment: order.payment,
          failure_reason: order.failure_reason,
          checkout_request_id: order.checkout_request_id,
          paymentMethod: order.payment_method,
          created_at: order.created_at,
          updated_at: order.updated_at,
          orderId: order.order_reference || order.id,
          order_reference: order.order_reference || order.id,
          address: orderAddress,
          review: item.review || null,
        });
      });
    });

    return allOrderItems;
  }, [orders]);

  const getGroupedOrders = (): GroupedOrder[] => {
    const groupedOrders: { [key: string]: GroupedOrder } = {};

    orderData.forEach((item) => {
      const groupedKey = String(item.orderId);
      if (!groupedOrders[groupedKey]) {
        groupedOrders[groupedKey] = {
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
      groupedOrders[groupedKey].items.push(item);
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
        <p className="text-secondary mb-6">We couldn&apos;t load your order information</p>
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
