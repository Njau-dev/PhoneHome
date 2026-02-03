import Link from "next/link";
import { getCompareSpecifications } from "@/lib/utils/compareSpecs";

const EmptyCompareSlot = () => {
  const specifications = getCompareSpecifications();

  return (
    <div className="col-span-1">
      <div className="h-48 md:h-64 border border-dashed border-border rounded-lg flex flex-col items-center justify-center mb-4">
        <p className="text-secondary text-sm mb-4">Add a product</p>
        <Link href="/collection">
          <button className="bg-bg-light text-primary px-4 py-2 rounded-lg hover:bg-accent hover:text-bg transition-all text-sm">
            Browse Products
          </button>
        </Link>
      </div>

      {specifications.map((_, index) => (
        <div key={index} className="py-3 md:py-4 border-t border-border">
          <p className="text-sm text-secondary">-</p>
        </div>
      ))}

      <div className="py-3 md:py-4 border-t border-border"></div>
    </div>
  );
};

export default EmptyCompareSlot;
