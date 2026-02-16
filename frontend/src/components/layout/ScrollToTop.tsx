"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Component that scrolls to top of page on route change
 * Place this in your root layout or main layout component
 */
const ScrollToTop = () => {
    const pathname = usePathname();

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, [pathname]);

    return null;
};

export default ScrollToTop;