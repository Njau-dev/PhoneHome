"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

interface SearchBarProps {
    variant?: "desktop" | "mobile";
    onSearch?: () => void;
}

const SearchBar = ({ variant = "desktop", onSearch }: SearchBarProps) => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const query = searchQuery.trim();
        if (!query) {
            router.push("/collection");
            return;
        }
        router.push(`/collection?q=${encodeURIComponent(query)}`);
        onSearch?.();
    };

    const handleClearSearch = () => {
        setSearchQuery("");
    };

    if (variant === "mobile") {
        return (
            <form
                onSubmit={handleSearch}
                className="flex items-center overflow-hidden rounded-full border border-nav-border/50"
            >
                <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products"
                    className="w-full px-4 py-2 text-sm text-nav-text outline-none placeholder:text-nav-muted bg-transparent"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={handleClearSearch}
                        className="p-2 text-nav-muted hover:text-nav-text"
                        aria-label="Clear search"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
                <button
                    type="submit"
                    className="bg-accent rounded-full p-2.5"
                    aria-label="Search products"
                >
                    <Search className="h-4 w-4 text-bg" />
                </button>
            </form>
        );
    }

    return (
        <form
            onSubmit={handleSearch}
            className="w-full max-w-xl items-center overflow-hidden rounded-full border border-nav-border/50 flex"
        >
            <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products"
                className="w-full px-4 py-2 text-sm text-nav-text outline-none placeholder:text-nav-muted bg-transparent"
            />
            {searchQuery && (
                <button
                    type="button"
                    onClick={handleClearSearch}
                    className="p-2 text-nav-muted hover:text-nav-text cursor-pointer"
                    aria-label="Clear search"

                >
                    <X className="h-4 w-4" />
                </button>
            )}
            <button
                type="submit"
                className="flex items-center gap-2 bg-accent px-4 py-2.5 text-bg rounded-full hover:bg-accent/80"
                aria-label="Search products"
            >
                Search
                <Search className="h-4 w-4 text-bg" />
            </button>
        </form>
    );
};

export default SearchBar;
