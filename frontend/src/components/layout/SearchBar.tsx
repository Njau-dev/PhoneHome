"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
// import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useUIStore } from "@/lib/stores/useUIStore";
import { Search, X } from "lucide-react";

const SearchBar = () => {
  const pathname = usePathname();
  const { showSearch, setShowSearch, searchQuery, setSearchQuery } =
    useUIStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname.includes("collection") && showSearch) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [pathname, showSearch]);

  return showSearch && visible ? (
    <div className="border-t border-border bg-bg text-center">
      <div className="inline-flex items-center justify-center border border-border px-5 py-2 my-5 sm:mx-3 rounded-full w-3/4 sm:w-1/2">
        <input
          className="flex-1 outline-none bg-inherit text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          type="text"
          placeholder="Search"
        />
        <Search className="w-4 text-accent" />
      </div>
      <X
        onClick={() => setShowSearch(false)}
        className="inline w-6 cursor-pointer"
      />
    </div>
  ) : null;
};

export default SearchBar;
