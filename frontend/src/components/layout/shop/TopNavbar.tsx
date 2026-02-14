"use client";

import Link from "next/link";
import { Menu, ShoppingCart, User } from "lucide-react";
import ThemeToggle from "@/components/common/ThemeToggle";
import SearchBar from "@/components/common/SearchBar";
import { useAuth, useCart, useCompare } from "@/lib/hooks";

interface TopNavbarProps {
    onMobileMenuToggle: () => void;
}

const TopNavbar = ({ onMobileMenuToggle }: TopNavbarProps) => {
    const { user, isAuthenticated } = useAuth();
    const { count, hasHydrated } = useCart();

    return (
        <div className="py-4">
            <div className="flex items-center justify-between gap-3">
                <Link href="/" className="shrink-0">
                    <img
                        src="/assets/logo.png"
                        alt="Phone Home logo"
                        className="h-16 w-auto"
                    />
                </Link>

                {/* Desktop search bar */}
                <div className="hidden md:block w-full max-w-xl">
                    <SearchBar variant="desktop" />
                </div>

                <div className="flex items-center gap-4">
                    <ThemeToggle />

                    <div className="group hidden py-2 px-3 items-center gap-2 md:flex border border-nav-border/50 rounded-full text-nav-text">
                        <User className="h-5 w-5 group-hover:rotate-12 transition-all duration-300 group-hover:text-accent" />
                        {isAuthenticated ? (
                            <Link
                                href="/profile"
                                className="max-w-24 truncate text-sm font-medium transition-colors duration-300 group-hover:text-accent"
                            >
                                {user?.username}
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="text-sm font-medium transition-colors duration-300 group-hover:text-accent"
                            >
                                Login
                            </Link>
                        )}
                    </div>

                    <Link href="/cart" className="relative">
                        <ShoppingCart className="h-5 w-5 text-nav-text hover:rotate-12 transition-all duration-200 hover:text-accent" />
                        <span className="absolute text-bg -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px]">
                            {hasHydrated ? count : 0}
                        </span>
                    </Link>

                    <button
                        className="md:hidden text-nav-text"
                        onClick={onMobileMenuToggle}
                        aria-label="Toggle menu"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
            </div>

            {/* Mobile search bar */}
            <div className="mt-3 md:hidden">
                <SearchBar variant="mobile" />
            </div>
        </div>
    );
};

export default TopNavbar;