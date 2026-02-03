import { Product } from "@/lib/types/product";
import { CURRENCY } from "./constants";
import { formatPrice } from "./format";

export const getCompareSpecifications = () => {
  return [
    { name: "Name", key: "name" },
    { name: "Brand", key: "brand" },
    { name: "Category", key: "category" },
    { name: "Rating", key: "rating" },
    {
      name: "Price",
      key: "price",
      format: (value: number) => `${CURRENCY} ${formatPrice(value)}`,
    },
    { name: "RAM", key: "ram" },
    { name: "Storage", key: "storage" },
    { name: "Processor", key: "processor" },
    { name: "Display", key: "display" },
    { name: "Main Camera", key: "main_camera" },
    { name: "Front Camera", key: "front_camera" },
    { name: "Operating System", key: "os" },
    { name: "Connectivity", key: "connectivity" },
    { name: "Colors", key: "colors" },
    { name: "Battery", key: "battery" },
  ];
};

export const getSpecValue = (product: Product, specKey: string) => {
  const productAny = product as any;
  
  // Handle variations
  if (product.hasVariation && productAny.variations?.length > 1) {
    if (specKey === "ram") {
      const rams = [...new Set(productAny.variations.map((v: any) => v.ram))];
      return rams.join(", ");
    }
    if (specKey === "storage") {
      const storages = [...new Set(productAny.variations.map((v: any) => v.storage))];
      return storages.join(", ");
    }
    if (specKey === "price") {
      const maxPrice = Math.max(...productAny.variations.map((v: any) => v.price));
      return `${product.price} - ${maxPrice}`;
    }
  }
  
  return productAny[specKey] || "-";
};
