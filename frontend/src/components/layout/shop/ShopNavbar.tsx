"use client";

import { useState } from "react";
import TopNavbar from "./TopNavbar";
import BottomNavbar from "./BottomNavbar";
import MobileMenu from "./MobileMenu";

const ShopNavbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            <header>
                {/* Top Navigation */}
                <TopNavbar onMobileMenuToggle={() => setMobileMenuOpen(true)} />

                {/* Bottom Navigation - Desktop only */}
                <BottomNavbar />
            </header>

            {/* Mobile Menu */}
            <MobileMenu
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
            />
        </>
    );
};

export default ShopNavbar;