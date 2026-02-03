import { Heart } from "lucide-react";

interface WishlistStatsProps {
  count: number;
}

const WishlistStats = ({ count }: WishlistStatsProps) => {
  return (
    <div className="bg-bg-card rounded-xl p-6 border border-border hover:border-accent transition-all shadow-md mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium">Saved Items</h3>
        <div className="p-2 bg-accent/20 rounded-full">
          <Heart className="w-5 h-5 text-accent" />
        </div>
      </div>
      <p className="text-3xl font-bold">{count}</p>
      <p className="text-secondary text-sm mt-4">Items in your wishlist</p>
    </div>
  );
};

export default WishlistStats;
