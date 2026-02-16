import { Package, CreditCard, Heart, Star } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";
import { CURRENCY } from "@/lib/utils/constants";

interface ProfileStatsProps {
  stats: {
    order_count: number;
    total_payment: number;
    wishlist_count: number;
    review_count: number;
  };
}

const ProfileStats = ({ stats }: ProfileStatsProps) => {
  const statsData = [
    {
      title: "Orders",
      value: stats.order_count,
      subtitle: "Total orders made",
      icon: Package,
    },
    {
      title: "Payments",
      value: `${CURRENCY} ${formatPrice(stats.total_payment)}`,
      subtitle: "Total amount spent",
      icon: CreditCard,
    },
    {
      title: "Wishlist",
      value: stats.wishlist_count,
      subtitle: "Saved items",
      icon: Heart,
    },
    {
      title: "Reviews",
      value: stats.review_count,
      subtitle: "Reviews submitted",
      icon: Star,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {statsData.map((stat, index) => (
        <div
          key={index}
          className="bg-bg-card rounded-xl p-6 border border-border hover:border-accent transition-all shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium">{stat.title}</h3>
            <div className="p-2 bg-accent/20 rounded-full">
              <stat.icon className="w-5 h-5 text-accent" />
            </div>
          </div>
          <p className="text-3xl font-bold">{stat.value}</p>
          <p className="text-secondary text-sm mt-4">{stat.subtitle}</p>
        </div>
      ))}
    </div>
  );
};

export default ProfileStats;
