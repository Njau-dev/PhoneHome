"use client";

import { useState } from "react";
import { Product } from "@/lib/types/product";

interface ProductTabsProps {
  productData: Product;
}

const ProductTabs = ({ productData }: ProductTabsProps) => {
  const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");

  return (
    <div className="mt-20">
      {/* Tab Headers */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("description")}
          className={`py-3 px-6 transition-colors ${activeTab === "description"
              ? "border-b-2 border-accent text-accent"
              : "text-secondary hover:text-primary"
            }`}
        >
          Description
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`py-3 px-6 transition-colors ${activeTab === "reviews"
              ? "border-b-2 border-accent text-accent"
              : "text-secondary hover:text-primary"
            }`}
        >
          Reviews ({productData.review_count || 0})
        </button>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTab === "description" ? (
          <div className="text-secondary">
            <p>{productData.description || "No description available."}</p>
          </div>
        ) : (
          <div className="text-secondary">
            <p>Reviews coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductTabs;
