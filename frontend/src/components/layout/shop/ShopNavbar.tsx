"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
    ChevronDown,
    ChevronRight,
    Menu,
    Search,
    ShoppingBag,
    Tag,
    User,
    X,
} from "lucide-react";
import ThemeToggle from "@/components/common/ThemeToggle";
import { productsAPI } from "@/lib/api/products";
import { useAuth, useCart } from "@/lib/hooks";
import { cn } from "@/lib/utils/cn";

const ShopNavbar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuth();
    const { count, hasHydrated } = useCart();

    const [searchQuery, setSearchQuery] = useState("");
    const [mobileOpen, setMobileOpen] = useState(false);
    const [openCategory, setOpenCategory] = useState<string | null>(null);

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
            { label: "Compare", href: "/compare" },
            { label: "Wishlist", href: "/wishlist" },
            { label: "Profile", href: "/profile" },
            { label: "Orders", href: "/orders" },
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

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const query = searchQuery.trim();
        if (!query) {
            router.push("/collection");
            return;
        }
        router.push(`/collection?q=${encodeURIComponent(query)}`);
    };

    const handleLogout = async () => {
        await logout();
    };

    return (
        <header className="sticky top-0 z-50">
            <div className="py-3">

                {/* top nav  */}
                <div className="flex items-center justify-between gap-3">
                    <Link href="/" className="shrink-0">
                        <img src="/assets/logo.png" alt="Phone Home logo" className="h-20 w-auto" />
                    </Link>

                    {/* main search bar */}
                    <form
                        onSubmit={handleSearch}
                        className="hidden w-full max-w-xl items-center overflow-hidden rounded-full border border-nav-border/50 md:flex"
                    >
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for products"
                            className="w-full px-4 py-2 text-sm text-nav-text outline-none placeholder:text-nav-muted"
                        />
                        <button
                            type="submit"
                            className="flex items-center gap-2 bg-accent px-4 py-2.5 rounded-full text-nav-text hover:bg-accent/80 "
                            aria-label="Search products"
                        >
                            Search
                            <Search className="h-4 w-4" />
                        </button>
                    </form>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />

                        {/* TODO: ADD group hover accent color and hover transition for icon */}
                        <div className="hidden py-2 px-3 items-center gap-2 md:flex border border-nav-border/50 rounded-full text-nav-text">
                            <User className="h-5 w-5" />
                            {isAuthenticated ? (
                                <Link href="/profile" className="max-w-24 truncate text-sm font-medium">
                                    {user?.username}
                                </Link>
                            ) : (
                                <Link href="/login" className="text-sm font-medium">
                                    Login
                                </Link>
                            )}
                        </div>

                        <Link href="/cart" className="relative text-nav-text">
                            <ShoppingBag className="h-5 w-5 " />
                            <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] ">
                                {hasHydrated ? count : 0}
                            </span>
                        </Link>

                        <button
                            className="md:hidden text-nav-text"
                            onClick={() => setMobileOpen((prev) => !prev)}
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* mobile search bar */}
                <form
                    onSubmit={handleSearch}
                    className="mt-3 flex items-center overflow-hidden rounded-full border border-nav-border/50 md:hidden"
                >
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for products"
                        className="w-full px-4 py-2 text-sm text-nav-text outline-none placeholder:text-nav-muted"
                    />
                    <button
                        type="submit"
                        className="bg-accent rounded-full p-2.5 text-nav-text"
                        aria-label="Search products"
                    >
                        <Search className="h-4 w-4 text-nav-text" />
                    </button>
                </form>
            </div>


            <div className="hidden items-center justify-between py-3 md:flex">
                <div className="flex items-center gap-4">

                    {/* categories dropdown */}
                    <div className="flex group relative">
                        <button className="flex items-center gap-2 text-nav-text text-sm font-medium hover:text-accent">
                            All Categories
                            <ChevronDown className="h-4 w-4" />
                        </button>

                        <div className="invisible absolute left-0 top-full z-20 mt-3 w-80 rounded-md bg-bg border border-border text-nav-muted py-4 px-3 opacity-0 shadow-md transition-all group-hover:visible group-hover:opacity-100">
                            {categoryLinks.map((category) => (
                                <div key={category.id} className="group/category py-1">
                                    <div className="flex items-center justify-between gap-2 rounded px-2 py-2 hover:bg-border">
                                        <Link href={category.href} className="text-base md:text-sm font-medium text-primary hover:text-accent">
                                            {category.label}
                                        </Link>

                                        <ChevronRight className="h-4 w-4 text-primary" />
                                    </div>

                                    {category.brands.length > 0 && (
                                        <div className="hidden gap-2 px-5 pb-2 pt-1 group-hover/category:flex group-hover/category:flex-wrap">
                                            {category.brands.map((brand) => (
                                                <Link
                                                    key={`${category.id}-${brand}`}
                                                    href={`/collection?category=${category.key}&brand=${encodeURIComponent(brand)}`}
                                                    className="rounded-full border border-nav-border/50 text-primary/90 px-2 py-1 text-xs hover:border-accent hover:text-accent"
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

                    <div className="h-5 w-px bg-nav-border/70" />

                    {/* Auth and non auth page routes */}
                    {customerLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "text-sm font-medium hover:text-accent",
                                pathname === link.href ? "font-semibold text-accent" : "text-nav-text"
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div className="flex gap-4">
                    {/* deals */}
                    <Link
                        href="/collection?deals=true"
                        className="flex items-center gap-2 text-sm font-medium text-nav-text hover:text-accent"
                    >
                        <Tag className="h-4 w-4" />
                        UP TO <span className="font-bold text-accent">30% OFF</span> all items
                    </Link>
                    {/* log out */}
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

            {mobileOpen && (
                <div className="space-y-4 border-t border-secondary text-nav-muted py-3 md:hidden">
                    <div className="rounded-md border border-secondary p-3">
                        <p className="mb-2 text-sm font-semibold">Categories</p>
                        <div className="space-y-2">
                            {categoryLinks.map((category) => (
                                <div key={category.id} className="rounded border border-secondary p-2">
                                    <div className="flex items-center justify-between">
                                        <Link
                                            href={category.href}
                                            onClick={() => setMobileOpen(false)}
                                            className="text-sm font-medium"
                                        >
                                            {category.label}
                                        </Link>
                                        <button
                                            onClick={() =>
                                                setOpenCategory((prev) =>
                                                    prev === category.key ? null : category.key
                                                )
                                            }
                                            className="rounded p-1 hover:bg-[#f3f4f6]"
                                            aria-label={`Toggle ${category.label} brands`}
                                        >
                                            <ChevronDown
                                                className={cn(
                                                    "h-4 w-4 transition-transform",
                                                    openCategory === category.key ? "rotate-180" : ""
                                                )}
                                            />
                                        </button>
                                    </div>

                                    {openCategory === category.key && category.brands.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {category.brands.map((brand) => (
                                                <Link
                                                    key={`${category.key}-${brand}`}
                                                    href={`/collection?category=${category.key}&brand=${encodeURIComponent(brand)}`}
                                                    onClick={() => setMobileOpen(false)}
                                                    className="rounded-full border border-nav-border/50 px-2 py-1 text-xs"
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

                    <div className="flex flex-col gap-2">
                        {customerLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className="rounded border border-secondary px-3 py-2 text-sm"
                            >
                                {link.label}
                            </Link>
                        ))}

                        <Link
                            href="/collection?deals=true"
                            onClick={() => setMobileOpen(false)}
                            className="rounded border border-accent bg-[#eff6ff] px-3 py-2 text-sm font-medium text-accent"
                        >
                            Deals & Offers
                        </Link>

                        {isAuthenticated ? (
                            <button
                                onClick={() => {
                                    void handleLogout();
                                    setMobileOpen(false);
                                }}
                                className="rounded border border-[#fecaca] px-3 py-2 text-left text-sm text-[#dc2626]"
                            >
                                Logout
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                onClick={() => setMobileOpen(false)}
                                className="rounded border border-secondary px-3 py-2 text-sm"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default ShopNavbar;
