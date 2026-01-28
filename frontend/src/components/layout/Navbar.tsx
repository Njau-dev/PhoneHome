"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    ShoppingBagIcon,
    UserIcon,
    ArrowLeftCircleIcon,
    Search,
    Menu,
} from "lucide-react";
import { useAuth, useCart } from "@/lib/hooks";
import { useUIStore } from "@/lib/stores/useUIStore";
import ThemeToggle from "../common/ThemeToggle";
import { cn } from "@/lib/utils/cn";

const Navbar = () => {
    const [visible, setVisible] = useState(false);
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuth();
    const { getCount } = useCart();
    const { toggleSearch } = useUIStore();

    const navLinks = [
        { name: "HOME", href: "/" },
        { name: "COLLECTION", href: "/collection" },
        { name: "COMPARE", href: "/compare" },
        { name: "CONTACT", href: "/contact" },
    ];

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="flex items-center justify-between py-3 font-medium">
            <Link href="/">
                <img src="/assets/logo.png" alt="Logo" className="w-28" />
            </Link>

            {/* Desktop Navigation */}
            <ul className="hidden sm:flex gap-5 text-sm text-primary">
                {navLinks.map((link) => (
                    <Link
                        key={link.name}
                        href={link.href}
                        className="flex flex-col items-center gap-1"
                    >
                        <p className="nav-links">{link.name}</p>
                        <hr
                            className={cn(
                                "w-2/4 border-none h-[1.5px] bg-accent",
                                pathname === link.href ? "block" : "hidden"
                            )}
                        />
                    </Link>
                ))}

                {/* Admin Panel Link - Only visible for admin users */}
                {user?.role === "admin" && (
                    <a
                        href="https://admin.phonehome.co.ke"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-1"
                    >
                        <p className="nav-links">ADMIN</p>
                        <hr className="w-2/4 border-none h-[1.5px] bg-accent hidden" />
                    </a>
                )}
            </ul>

            {/* Icons Section */}
            <div className="flex items-center gap-5">
                <ThemeToggle />

                <Link href="/collection" onClick={() => toggleSearch()}>
                    <Search className="w-6 icons hover:text-accent cursor-pointer" />
                </Link>

                <div className="group relative">
                    <Link href={isAuthenticated ? "#" : "/login"}>
                        <UserIcon className="w-6 icons hover:text-accent cursor-pointer" />
                    </Link>

                    {/* Dropdown menu */}
                    {isAuthenticated && (
                        <div className="group-hover:block hidden absolute dropdown-menu -right-8 pt-4 z-20">
                            <div className="flex flex-col gap-2 w-36 py-3 px-5 bg-bg text-primary rounded border border-border">
                                <Link
                                    href="/profile"
                                    className="cursor-pointer hover:text-accent"
                                >
                                    My profile
                                </Link>
                                <Link
                                    href="/wishlist"
                                    className="cursor-pointer hover:text-accent"
                                >
                                    My wishlist
                                </Link>
                                <Link
                                    href="/orders"
                                    className="cursor-pointer hover:text-accent"
                                >
                                    My orders
                                </Link>
                                <p
                                    onClick={handleLogout}
                                    className="cursor-pointer hover:text-accent"
                                >
                                    Logout
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <Link href="/cart" className="relative">
                    <ShoppingBagIcon className="w-6 icons hover:text-accent" />
                    <p className="absolute -right-1.25 -bottom-1.25 w-4 text-center leading-4 bg-accent text-bg aspect-square rounded-full text-[10px]">
                        {getCount()}
                    </p>
                </Link>

                <Menu
                    onClick={() => setVisible(true)}
                    className="size-6 cursor-pointer sm:hidden"
                />
            </div>

            {/* Mobile Sidebar Menu */}
            <div
                className={cn(
                    "absolute z-40 top-0 right-0 bottom-0 left-0 overflow-hidden bg-bg transition-all",
                    visible ? "w-full" : "w-0"
                )}
            >
                <div className="flex flex-col text-primary">
                    <div className="flex flex-col justify-between gap-4 p-3">
                        <div
                            onClick={() => setVisible(false)}
                            className="flex items-center justify-between cursor-pointer"
                        >
                            <img src="/assets/logo.png" alt="Logo" className="w-28" />
                            <div className="flex items-center">
                                <ArrowLeftCircleIcon className="h-5 text-accent mx-2" />
                                <p>Back</p>
                            </div>
                        </div>

                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setVisible(false)}
                                className="py-2 pl-6 border border-border"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
