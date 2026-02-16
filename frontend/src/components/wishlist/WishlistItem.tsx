import Link from "next/link";
import Image from "next/image";
import { SquareStack, Trash2 } from "lucide-react";
import { CURRENCY } from "@/lib/utils/constants";
import { formatPrice } from "@/lib/utils/format";

interface WishlistItemProps {
  item: {
    id: number;
    name: string;
    brand: string;
    category: string;
    price: number;
    image_url: string;
  };
  onRemove: () => void;
  onAddToCompare: () => void;
}

const WishlistItem = ({ item, onRemove, onAddToCompare }: WishlistItemProps) => {
  return (
    <tr className="border-b border-border hover:bg-bg-light/50 transition-all">
      <td className="py-4">
        <Link href={`/product/${item.id}`}>
          <div className="flex items-center">
            <Image
              src={item.image_url || "/assets/logo.png"}
              alt={item.name}
              width={64}
              height={64}
              unoptimized
              className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md mr-3"
            />
            <p className="font-medium text-sm sm:text-base hover:text-accent transition-colors">
              {item.name}
            </p>
          </div>
        </Link>
      </td>
      <td className="py-4 text-sm sm:text-base">{item.brand}</td>
      <td className="py-4 text-sm sm:text-base">{item.category}</td>
      <td className="py-4 text-sm sm:text-base">
        {CURRENCY} {formatPrice(item.price)}
      </td>
      <td className="py-4">
        <div className="flex space-x-3">
          <button
            onClick={onAddToCompare}
            className="p-2 rounded-full bg-info/20 text-info hover:bg-info/30 transition-all"
            title="Add to compare"
          >
            <SquareStack className="h-4 w-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-2 rounded-full bg-error/20 text-error hover:bg-error/30 transition-all"
            title="Remove from wishlist"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default WishlistItem;
