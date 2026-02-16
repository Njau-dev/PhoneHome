"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useProducts } from "@/lib/hooks";
import Title from "@/components/common/Title";
import ProductItem from "@/components/product/ProductItem";
import Pagination from "@/components/common/Pagination";
import BrandedSpinner from "@/components/common/BrandedSpinner";
import { ProductType } from "@/lib/types/product";
import { CURRENCY } from "@/lib/utils/constants";
import { productsAPI } from "@/lib/api/products";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";

function CollectionContent() {
    const searchParams = useSearchParams();
    const urlSearchQuery = searchParams.get("q");
    const initialCategory = searchParams.get("category") as ProductType | null;
    const initialBrand = searchParams.get("brand");
    const { allProducts, isLoading: productsLoading } = useProducts();

    const [showFilter, setShowFilter] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<ProductType | null>(initialCategory);
    const [selectedBrand, setSelectedBrand] = useState<string | null>(initialBrand);
    const [sortOption, setSortOption] = useState("relevant");

    // Price range states
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(500000);
    const [currentMinPrice, setCurrentMinPrice] = useState(0);
    const [currentMaxPrice, setCurrentMaxPrice] = useState(500000);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 20;

    // Fetch categories
    const { data: categories = [] } = useQuery({
        queryKey: ["categories"],
        queryFn: productsAPI.getCategories,
    });

    // Fetch brands based on selected category
    const { data: brands = [] } = useQuery({
        queryKey: ["brands", selectedCategory],
        queryFn: async () => {
            if (!selectedCategory) return [];
            return productsAPI.getBrandsByCategory(selectedCategory);
        },
        enabled: !!selectedCategory,
    });

    // Filter and sort products
    const filteredAndSortedProducts = useMemo(() => {
        let filtered = [...allProducts];

        // Category filter
        if (selectedCategory) {
            filtered = filtered.filter((p) => p.type === selectedCategory);
        }

        // Brand filter
        if (selectedBrand) {
            filtered = filtered.filter((p) => p.brand === selectedBrand);
        }

        // Price filter
        filtered = filtered.filter(
            (p) => p.price >= minPrice && p.price <= maxPrice
        );

        // Search filter
        if (urlSearchQuery) {
            const query = urlSearchQuery.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    p.name.toLowerCase().includes(query) ||
                    p.brand.toLowerCase().includes(query) ||
                    p.type.toLowerCase().includes(query) ||
                    p.description?.toLowerCase().includes(query)
            );
        }

        // Sort
        filtered.sort((a, b) => {
            switch (sortOption) {
                case "low-high":
                    return a.price - b.price;
                case "high-low":
                    return b.price - a.price;
                default:
                    return 0;
            }
        });

        return filtered;
    }, [
        allProducts,
        selectedCategory,
        selectedBrand,
        minPrice,
        maxPrice,
        urlSearchQuery,
        sortOption,
    ]);

    // Pagination
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredAndSortedProducts.slice(
        indexOfFirstProduct,
        indexOfLastProduct
    );
    const totalPages = Math.ceil(
        filteredAndSortedProducts.length / productsPerPage
    );

    const applyPriceFilter = () => {
        if (currentMinPrice > currentMaxPrice) {
            setMaxPrice(currentMinPrice);
            setMinPrice(currentMinPrice);
        } else {
            setMinPrice(currentMinPrice);
            setMaxPrice(currentMaxPrice);
        }
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSelectedCategory(null);
        setSelectedBrand(null);
        setMinPrice(0);
        setMaxPrice(500000);
        setCurrentMinPrice(0);
        setCurrentMaxPrice(500000);
        setCurrentPage(1);
    };

    if (productsLoading) {
        return <BrandedSpinner message="Loading products..." />;
    }

    return (

        <div className="flex flex-col sm:flex-row gap-1 sm:gap-10 pt-4">
            {/* Filter Options */}
            <div className="min-w-60">
                <p
                    onClick={() => setShowFilter(!showFilter)}
                    className="my-2 text-xl flex items-center cursor-pointer gap-2"
                >
                    FILTERS
                    <ChevronDown
                        className={`h-4 sm:hidden transition-transform ${showFilter ? "rotate-180" : ""
                            }`}
                    />
                </p>

                {/* Price Range Filter */}
                <div
                    className={`border border-border rounded-lg px-5 py-3 my-7 ${showFilter ? "" : "hidden"
                        } sm:block`}
                >
                    <p className="mb-3 text-sm font-medium">PRICE RANGE</p>
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-col w-full">
                                <label className="text-xs text-secondary mb-1">
                                    Min Price
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary">
                                        {CURRENCY}
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={currentMinPrice}
                                        onChange={(e) =>
                                            setCurrentMinPrice(parseInt(e.target.value) || 0)
                                        }
                                        className="w-full bg-bg border border-border rounded-md py-2 pl-12 pr-2 text-sm outline-none focus:border-accent"
                                        placeholder="Min Price"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col w-full">
                                <label className="text-xs text-secondary mb-1">
                                    Max Price
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary">
                                        {CURRENCY}
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={currentMaxPrice}
                                        onChange={(e) =>
                                            setCurrentMaxPrice(parseInt(e.target.value) || 0)
                                        }
                                        className="w-full bg-bg border border-border rounded-md py-2 pl-12 pr-2 text-sm outline-none focus:border-accent"
                                        placeholder="Max Price"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={applyPriceFilter}
                            className="mt-2 bg-accent hover:bg-bg hover:text-accent border border-transparent hover:border-accent text-bg text-sm py-2 px-3 rounded-full transition duration-300"
                        >
                            Apply Price Filter
                        </button>
                    </div>
                </div>

                {/* Categories Filter */}
                <div
                    className={`border border-border rounded-lg pl-5 py-3 my-7 ${showFilter ? "" : "hidden"
                        } sm:block`}
                >
                    <p className="mb-3 text-sm font-medium">CATEGORIES</p>
                    <div className="flex flex-col gap-2 text-sm font-light text-primary">
                        {categories.map((category) => (
                            <label
                                key={category.id}
                                className="flex gap-2 items-center cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    className="hidden peer"
                                    onChange={() =>
                                        setSelectedCategory(
                                            selectedCategory === (category.name.toLowerCase() as ProductType)
                                                ? null
                                                : category.name.toLowerCase() as ProductType
                                        )
                                    }
                                    checked={selectedCategory === (category.name.toLowerCase() as ProductType)}
                                />
                                <div className="w-5 h-5 border-2 border-border peer-checked:bg-accent peer-checked:border-accent transition duration-300 rounded-full">
                                </div>
                                <span className="ml-2 text-base">{category.name}</span>
                            </label>
                        ))}
                    </div>

                    <button
                        onClick={clearFilters}
                        className="mt-3 text-error hover:underline text-sm"
                    >
                        Clear Filters
                    </button>
                </div>

                {/* Brands */}
                {selectedCategory && brands.length > 0 && (
                    <div
                        className={`border border-border rounded-lg pl-5 py-3 my-6 ${showFilter ? "" : "hidden"
                            } sm:block`}
                    >
                        <p className="mb-3 text-sm font-medium">BRANDS</p>
                        <div className="flex flex-col gap-2 text-sm font-light text-primary">
                            {brands.map((brand) => (
                                <label
                                    key={brand.id}
                                    className="flex gap-2 items-center cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        className="hidden peer"
                                        onChange={() =>
                                            setSelectedBrand(
                                                selectedBrand === brand.name ? null : brand.name
                                            )
                                        }
                                        checked={selectedBrand === brand.name}
                                    />
                                    <div className="w-5 h-5 border-2 border-border peer-checked:bg-accent peer-checked:border-accent transition duration-300 rounded-full"></div>
                                    <span className="ml-2">{brand.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Products Grid */}
            <div className="flex-1">
                <div className="flex justify-between items-center my-3">
                    <div className="text-[18px] sm:text-2xl">
                        <Title text1="OUR" text2="SHOP" />
                    </div>

                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="border border-border bg-bg text-xs sm:text-sm px-3 py-2 mb-3 rounded outline-none focus:border-accent"
                    >
                        <option value="relevant">Sort by: Relevant</option>
                        <option value="low-high">Sort by: Low to High</option>
                        <option value="high-low">Sort by: High to Low</option>
                    </select>
                </div>

                <p className="text-sm text-secondary mb-4">
                    Showing {currentProducts.length} of{" "}
                    {filteredAndSortedProducts.length} products
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6">
                    {currentProducts.length > 0 ? (
                        currentProducts.map((product) => (
                            <ProductItem key={product.id} product={product} />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-secondary py-10">
                            No products available.
                        </p>
                    )}
                </div>

                {filteredAndSortedProducts.length > productsPerPage && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        paginate={setCurrentPage}
                    />
                )}
            </div>
        </div>
    );
}

export default function CollectionPage() {
    return (
        <Suspense fallback={<BrandedSpinner message="Loading products..." />}>
            <CollectionContent />
        </Suspense>
    );
}
