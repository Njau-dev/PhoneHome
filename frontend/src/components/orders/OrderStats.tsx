import { Package, Clock, ArrowRight, AlertTriangle } from "lucide-react";

interface OrderStatsProps {
  stats: {
    total: number;
    processing: number;
    delivered: number;
    failed: number;
    totalItems: number;
  };
}

const OrderStats = ({ stats }: OrderStatsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      <div className="bg-bg-card rounded-xl p-6 border border-border hover:border-accent transition-all shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Total Orders</h3>
          <div className="p-2 bg-accent/20 rounded-full">
            <Package className="w-5 h-5 text-accent" />
          </div>
        </div>
        <p className="text-3xl font-bold">{stats.total}</p>
        <p className="text-secondary text-sm mt-4">Orders placed</p>
      </div>

      <div className="bg-bg-card rounded-xl p-6 border border-border hover:border-accent transition-all shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Processing</h3>
          <div className="p-2 bg-info/20 rounded-full">
            <Clock className="w-5 h-5 text-info" />
          </div>
        </div>
        <p className="text-3xl font-bold">{stats.processing}</p>
        <p className="text-secondary text-sm mt-4">Orders in progress</p>
      </div>

      <div className="bg-bg-card rounded-xl p-6 border border-border hover:border-accent transition-all shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Delivered</h3>
          <div className="p-2 bg-success/20 rounded-full">
            <ArrowRight className="w-5 h-5 text-success" />
          </div>
        </div>
        <p className="text-3xl font-bold">{stats.delivered}</p>
        <p className="text-secondary text-sm mt-4">Completed orders</p>
      </div>

      <div className="bg-bg-card rounded-xl p-6 border border-border hover:border-error transition-all shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Failed</h3>
          <div className="p-2 bg-error/20 rounded-full">
            <AlertTriangle className="w-5 h-5 text-error" />
          </div>
        </div>
        <p className="text-3xl font-bold text-error">{stats.failed}</p>
        <p className="text-secondary text-sm mt-4">Payment failed</p>
      </div>

      <div className="bg-bg-card rounded-xl p-6 border border-border hover:border-accent transition-all shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Items</h3>
          <div className="p-2 bg-purple-500/20 rounded-full">
            <Package className="w-5 h-5 text-purple-400" />
          </div>
        </div>
        <p className="text-3xl font-bold">{stats.totalItems}</p>
        <p className="text-secondary text-sm mt-4">Total items purchased</p>
      </div>
    </div>
  );
};

export default OrderStats;
