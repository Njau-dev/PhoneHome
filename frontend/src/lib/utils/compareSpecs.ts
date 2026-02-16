import { Product } from "@/lib/types/product";
import { CURRENCY } from "./constants";
import { formatPrice } from "./format";

type CompareSpecValue = string | number;

type CompareSpecification = {
  name: string;
  key: string;
  format?: (value: CompareSpecValue) => string;
};

type VariationSpec = {
  ram?: string;
  storage?: string;
  price?: unknown;
};

type ProductWithVariations = Product & {
  variations?: VariationSpec[];
} & Record<string, unknown>;

const parsePrice = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const numericValue = Number(value.replace(/,/g, "").trim());
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  return null;
};

const formatComparePrice = (value: unknown): string => {
  const singlePrice = parsePrice(value);
  if (singlePrice !== null) {
    return `${CURRENCY} ${formatPrice(singlePrice)}`;
  }

  if (typeof value !== "string") {
    return "-";
  }

  const rangeParts = value
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean);

  if (rangeParts.length === 2) {
    const minPrice = parsePrice(rangeParts[0]);
    const maxPrice = parsePrice(rangeParts[1]);

    if (minPrice !== null && maxPrice !== null) {
      return `${CURRENCY} ${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
    }
  }

  return value || "-";
};

export const getCompareSpecifications = (): CompareSpecification[] => {
  return [
    { name: "Name", key: "name" },
    { name: "Brand", key: "brand" },
    { name: "Category", key: "category" },
    { name: "Rating", key: "rating" },
    {
      name: "Price",
      key: "price",
      format: (value: CompareSpecValue) => formatComparePrice(value),
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

export const getSpecValue = (product: Product, specKey: string): CompareSpecValue => {
  const productWithVariations = product as ProductWithVariations;
  const variations = Array.isArray(productWithVariations.variations)
    ? productWithVariations.variations
    : [];
  
  // Handle variations
  if (product.hasVariation && variations.length > 1) {
    if (specKey === "ram") {
      const rams = [
        ...new Set(
          variations
            .map((variation) => variation.ram)
            .filter((ram): ram is string => Boolean(ram))
        ),
      ];
      return rams.join(", ");
    }
    if (specKey === "storage") {
      const storages = [
        ...new Set(
          variations
            .map((variation) => variation.storage)
            .filter((storage): storage is string => Boolean(storage))
        ),
      ];
      return storages.join(", ");
    }
    if (specKey === "price") {
      const prices = variations
        .map((variation) => parsePrice(variation.price))
        .filter((price: number | null): price is number => price !== null);

      if (prices.length) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        return `${minPrice} - ${maxPrice}`;
      }
    }
  }

  const rawValue = productWithVariations[specKey];

  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return "-";
  }

  if (typeof rawValue === "string" || typeof rawValue === "number") {
    return rawValue;
  }

  return String(rawValue);
};
