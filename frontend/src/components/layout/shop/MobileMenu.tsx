"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
    ChevronDown,
    ChevronRight,
    Heart,
    Home,
    LogOut,
    Package,
    Phone,
    Shield,
    SquareStack,
    Store,
    Tag,
    User,
    X
} from "lucide-react";
import SearchBar from "@/components/common/SearchBar";
import { productsAPI } from "@/lib/api/products";
import { useAuth } from "@/lib/hooks";
import { cn } from "@/lib/utils/cn";
import { usePathname } from "next/navigation";

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
    const { user, isAuthenticated, logout } = useAuth();
    const [openCategory, setOpenCategory] = useState<string | null>(null);
    const [showCategories, setShowCategories] = useState(false);
    const pathname = usePathname();
    const adminPanelUrl =
        process.env.NEXT_PUBLIC_ADMIN_PANEL_URL || "https://admin.phonehome.co.ke";

    const handleCloseMenu = () => {
        setShowCategories(false);
        setOpenCategory(null);
        onClose();
    };

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
            { label: "Home", href: "/", icon: <Home className="h-4 w-4" /> },
            { label: "Collection", href: "/collection", icon: <Store className="h-4 w-4" /> },
            { label: "Compare", href: "/compare", icon: <SquareStack className="h-4 w-4" /> },
            { label: "Wishlist", href: "/wishlist", icon: <Heart className="h-4 w-4" /> },
            { label: "Profile", href: "/profile", icon: <User className="h-4 w-4" /> },
            { label: "Orders", href: "/orders", icon: <Package className="h-4 w-4" /> },
            { label: "Contact", href: "/contact", icon: <Phone className="h-4 w-4" /> },
            ...(user?.role === "admin"
                ? [
                    {
                        label: "Admin Panel",
                        href: adminPanelUrl,
                        icon: <Shield className="h-4 w-4" />,
                        external: true,
                    },
                ]
                : []),
        ]
        : [
            { label: "Home", href: "/", icon: <Home className="h-4 w-4" /> },
            { label: "Collection", href: "/collection", icon: <Store className="h-4 w-4" /> },
            { label: "Compare", href: "/compare", icon: <SquareStack className="h-4 w-4" /> },
            { label: "Contact", href: "/contact", icon: <Phone className="h-4 w-4" /> },
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
        handleCloseMenu();
    };

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={handleCloseMenu}
            />

            {/* Slide-in Menu */}
            <div
                className={cn(
                    "fixed top-0 right-0 h-full w-[85%] max-w-sm bg-bg z-50 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto md:hidden",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="sticky top-0 bg-black-soft z-10 border-b border-border p-4">
                    <div className="flex items-center justify-between mb-4">
                        <Link href="/" onClick={handleCloseMenu} className="shrink-0">
                            <Image
                                src="/assets/logo.png"
                                alt="Phone Home logo"
                                width={200}
                                height={64}
                                className="h-16 w-auto"
                            />
                        </Link>
                        <button
                            onClick={handleCloseMenu}
                            className="p-2 hover:bg-border rounded-full transition-colors"
                            aria-label="Close menu"
                        >
                            <X className="h-6 w-6 text-nav-text" />
                        </button>
                    </div>

                    {/* Search in mobile menu */}
                    <SearchBar variant="mobile" onSearch={handleCloseMenu} />
                </div>

                {/* Menu Content */}
                <div className="flex flex-col h-[calc(100%-140px)] justify-between">
                    {/* Scrollable Top Section */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Categories Section */}
                        <div className="space-y-2">
                            <button
                                onClick={() => setShowCategories(!showCategories)}
                                className="w-full flex items-center justify-between p-3 rounded-lg border border-border text-primary hover:bg-border/50 transition-colors"
                            >
                                <span className="font-semibold text-sm">All Categories</span>
                                <ChevronDown
                                    className={cn(
                                        "h-5 w-5 transition-transform duration-200",
                                        showCategories ? "rotate-180" : ""
                                    )}
                                />
                            </button>

                            {showCategories && (
                                <div className="space-y-2 pl-2 animate-in slide-in-from-top-2 duration-200">
                                    {categoryLinks.map((category) => (
                                        <div key={category.id} className="space-y-2">
                                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-border/50">
                                                <Link
                                                    href={category.href}
                                                    onClick={handleCloseMenu}
                                                    className="flex-1 text-sm font-medium text-primary hover:text-accent"
                                                >
                                                    {category.label}
                                                </Link>
                                                {category.brands.length > 0 && (
                                                    <button
                                                        onClick={() =>
                                                            setOpenCategory((prev) =>
                                                                prev === category.key ? null : category.key
                                                            )
                                                        }
                                                        className="p-1 hover:bg-border rounded"
                                                        aria-label={`Toggle ${category.label} brands`}
                                                    >
                                                        <ChevronRight
                                                            className={cn(
                                                                "h-4 w-4 transition-transform duration-200",
                                                                openCategory === category.key ? "rotate-90" : ""
                                                            )}
                                                        />
                                                    </button>
                                                )}
                                            </div>

                                            {openCategory === category.key && category.brands.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pl-4 pb-2 animate-in slide-in-from-top-2 duration-200">
                                                    {category.brands.map((brand) => (
                                                        <Link
                                                            key={`${category.key}-${brand}`}
                                                            href={`/collection?category=${category.key}&brand=${encodeURIComponent(brand)}`}
                                                            onClick={handleCloseMenu}
                                                            className="rounded-full border border-nav-border/50 px-3 py-1 text-xs text-primary hover:border-accent hover:text-accent transition-colors"
                                                        >
                                                            {brand}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-border" />

                        {/* Navigation Links */}
                        <div className="space-y-2">
                            {customerLinks.map((link) => {
                                const isExternal = "external" in link && link.external;

                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={handleCloseMenu}
                                        target={isExternal ? "_blank" : undefined}
                                        rel={isExternal ? "noopener noreferrer" : undefined}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-border/50 transition-colors",
                                            pathname === link.href
                                                ? "text-accent border-accent/30 bg-accent/5"
                                                : "text-primary hover:text-accent"
                                        )}
                                    >
                                        {link.icon}
                                        <span className="text-sm font-medium">{link.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Fixed Bottom Section */}
                    <div className="border-t border-border bg-bg p-4 space-y-2">
                        {/* Deals Link */}
                        <Link
                            href="/collection?deals=true"
                            onClick={handleCloseMenu}
                            className="flex items-center gap-3 p-3 rounded-lg border border-accent bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                        >
                            <Tag className="h-4 w-4" />
                            <span className="text-sm font-medium">Deals & Offers</span>
                        </Link>

                        {/* Auth Actions */}
                        {isAuthenticated ? (
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 p-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="text-sm font-medium">Logout</span>
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                onClick={handleCloseMenu}
                                className="flex items-center gap-3 p-3 rounded-lg border border-border text-primary hover:bg-border/50 transition-colors"
                            >
                                <User className="h-4 w-4" />
                                <span className="text-sm font-medium">Login</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default MobileMenu;
