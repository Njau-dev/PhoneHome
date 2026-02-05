import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { CURRENCY } from "@/lib/utils/constants";
import StatusBadge from "@/components/common/StatusBadge";

interface OrderCardProps {
  order: any;
  onTrack: () => void;
}

const OrderCard = ({ order, onTrack }: OrderCardProps) => {
  const getPaymentStatus = () => {
    if (order.payment === "Success" || order.payment === "success") return "Paid";
    if (order.payment === "Failed" || order.payment === "failed") return "Failed";
    if (order.payment === "Pending" || order.payment === "pending") return "Processing";
    if (order.payment === "Cancelled" || order.payment === "cancelled") return "Cancelled";
    if (order.payment === "refunded") return "Refunded";
    if (order.paymentMethod === "COD" && order.status !== "Delivered") return "Unpaid";
    if (order.paymentMethod === "COD" && order.status === "Delivered") return "Paid";
    return "Unpaid";
  };

  return (
    <div className="bg-bg-card rounded-xl border border-border hover:border-accent/50 transition-all shadow-md overflow-hidden">
      {/* Order Header */}
      <div className="p-4 border-b border-border bg-bg-light flex flex-col sm:flex-row justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold">
              Order #{order.order_reference || order.id}
            </h3>
            <StatusBadge status={order.status} type="order" />
          </div>
          <p className="text-sm text-secondary">
            {formatDate(order.created_at)}
            <span className="ml-2 text-xs">
              ({new Date(order.created_at).toLocaleTimeString()})
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          <StatusBadge status={getPaymentStatus()} type="payment" />
          <p className="text-sm font-medium">{order.paymentMethod}</p>
        </div>
      </div>

      {/* Order Items */}
      <div className="p-4">
        {order.items.map((item: any, index: number) => (
          <div
            key={index}
            className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 ${index !== order.items.length - 1 ? "border-b border-border border-dashed" : ""
              }`}
          >
            <img
              src={item.image_url}
              alt={item.name}
              className="w-20 h-20 object-cover rounded-md border border-border"
            />

            <div className="grow">
              <h4 className="font-medium mb-1">{item.name}</h4>
              {item.variation_name && (
                <p className="text-sm text-secondary mb-1">
                  Variation: {item.variation_name}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                <p className="text-sm">
                  <span className="text-secondary">Price:</span> {CURRENCY}{" "}
                  {formatPrice(item.price)}
                </p>
                <p className="text-sm">
                  <span className="text-secondary">Qty:</span> {item.quantity}
                </p>
                <p className="text-sm font-medium">
                  <span className="text-secondary">Total:</span> {CURRENCY}{" "}
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Footer */}
      <div className="p-4 border-t border-border bg-bg-light flex flex-col sm:flex-row items-center justify-between">
        <div className="text-sm text-secondary mb-3 sm:mb-0">
          Total Items: <span className="font-medium text-primary">{order.items.length}</span>
        </div>

        <div className="flex gap-2">
          <Link href={`/orders/${order.order_reference || order.id}`}>
            <button className="border border-accent bg-bg text-accent px-4 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-bg transition-all">
              View Details
            </button>
          </Link>

          <button
            onClick={onTrack}
            className="border border-accent bg-accent text-bg px-4 py-2 text-sm font-medium rounded-md hover:bg-bg hover:text-accent transition-all"
          >
            Track Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
