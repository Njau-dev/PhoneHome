"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Tag } from "lucide-react";
import { productsAPI } from "@/lib/api/products";
import { useAuth, useCompare } from "@/lib/hooks";
import { cn } from "@/lib/utils/cn";

const BottomNavbar = () => {
    const pathname = usePathname();
    const { isAuthenticated, logout } = useAuth();
    const { getCompareCount, hasHydrated } = useCompare();
    const compareCount = hasHydrated ? getCompareCount() : 0;

    const { data: categories = [] } = useQuery({
        queryKey: ["categories"],
        queryFn: productsAPI.getCategories,
    });

    const { data: allProducts = [] } = useQuery({
        queryKey: ["products"],
        queryFn: productsAPI.getAll,
        staleTime: 5 * 60 * 1000,
    });

    const categoryBrands = useMemo(() => {
        const grouped = allProducts.reduce<Record<string, string[]>>((acc, product) => {
            const categoryKey = product.type;
            if (!acc[categoryKey]) {
                acc[categoryKey] = [];
            }

            if (!acc[categoryKey].includes(product.brand)) {
                acc[categoryKey].push(product.brand);
            }

            return acc;
        }, {});

        return grouped;
    }, [allProducts]);

    const customerLinks = isAuthenticated
        ? [
            { label: "Collection", href: "/collection" },
            { label: "Compare", href: "/compare" },
            { label: "Wishlist", href: "/wishlist" },
            { label: "Profile", href: "/profile" },
            { label: "Orders", href: "/orders" },
            { label: "Contact", href: "/contact" },
        ]
        : [
            { label: "Collection", href: "/collection" },
            { label: "Compare", href: "/compare" },
            { label: "Contact", href: "/contact" },
        ];

    const categoryLinks = categories.map((category) => {
        const key = category.name.toLowerCase();
        return {
            id: category.id,
            label: category.name,
            href: `/collection?category=${key}`,
            key,
            brands: categoryBrands[key] ?? [],
        };
    });

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="hidden items-center justify-between py-3 md:flex">
            <div className="flex items-center gap-4">
                {/* Categories dropdown */}
                <div className="flex group relative">
                    <button className="flex items-center gap-2 text-nav-text text-sm font-medium transition-colors duration-500 group-hover:text-accent">
                        All Categories
                        <ChevronDown className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" />
                    </button>

                    <div className="invisible absolute left-0 top-full z-20 mt-3 w-80 rounded-md bg-bg border border-border text-nav-muted py-4 px-3 opacity-0 shadow-md transition-all duration-500 ease-in-out group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 -translate-y-2">
                        {categoryLinks.map((category) => (
                            <div key={category.id} className="group/category py-1">
                                <div className="flex items-center justify-between gap-2 rounded px-2 py-2 transition-colors duration-400 hover:bg-border">
                                    <Link
                                        href={category.href}
                                        className="text-base md:text-sm font-medium text-primary transition-colors duration-400 hover:text-accent"
                                    >
                                        {category.label}
                                    </Link>
                                    <ChevronRight className="h-4 w-4 text-primary transition-transform duration-400 group-hover/category:translate-x-1" />
                                </div>

                                {category.brands.length > 0 && (
                                    <div className="hidden gap-2 px-5 pb-2 pt-1 group-hover/category:flex group-hover/category:flex-wrap">
                                        {category.brands.map((brand) => (
                                            <Link
                                                key={`${category.id}-${brand}`}
                                                href={`/collection?category=${category.key}&brand=${encodeURIComponent(brand)}`}
                                                className="rounded-full border border-nav-border/50 text-primary/90 px-2 py-1 text-xs transition-all duration-400 hover:border-accent hover:text-accent hover:shadow-sm"
                                            >
                                                {brand}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="h-5 w-0.5 bg-nav-border/70" />

                {/* Navigation links */}
                {customerLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "relative text-[15px] font-medium text-nav-text hover:text-nav-text transition-colors group px-1",
                            pathname === link.href && "text-accent"
                        )}
                    >
                        {link.label}
                        {link.href === "/compare" && (
                            <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-bg">
                                {compareCount}
                            </span>
                        )}
                        <span
                            className={cn(
                                "absolute -bottom-3 left-0 h-0.5 bg-accent transition-all duration-400 ease-out",
                                pathname === link.href
                                    ? "w-full"
                                    : "w-0 group-hover:w-full"
                            )}
                        />
                    </Link>
                ))}
            </div>

            <div className="flex gap-4">
                {/* Deals */}
                <Link
                    href="/collection?deals=true"
                    className="flex items-center gap-2 text-sm font-medium text-nav-text transition-all duration-300 hover:text-accent"
                >
                    <Tag className="h-4 w-4" />
                    UP TO <span className="font-bold text-accent">30% OFF</span> all items
                </Link>

                {/* Logout */}
                {isAuthenticated && (
                    <button
                        onClick={handleLogout}
                        className="text-sm text-[#6b7280] hover:text-error"
                    >
                        Logout
                    </button>
                )}
            </div>
        </div>
    );
};

export default BottomNavbar;
