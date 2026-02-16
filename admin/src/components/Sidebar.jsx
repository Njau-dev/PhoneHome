import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Package, ShoppingCart, Users, ChevronLeft, ChevronRight, Menu } from 'lucide-react';

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user } = useAuth();

    // Check if screen is mobile
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth < 1024) {
                setCollapsed(true);
            }
        };

        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);

        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    const toggleSidebar = () => {
        if (isMobile) {
            setMobileOpen(!mobileOpen);
        } else {
            setCollapsed(!collapsed);
        }
    };

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: Home },
        { name: 'Products', path: '/products', icon: Package },
        { name: 'Orders', path: '/orders', icon: ShoppingCart },
        { name: 'Users', path: '/users', icon: Users },
    ];

    // Mobile menu button for small screens
    const MobileMenuButton = () => (
        <button
            onClick={toggleSidebar}
            className="lg:hidden fixed z-50 bottom-4 right-4 p-3 rounded-full bg-accent text-bgdark shadow-lg"
        >
            <Menu className="h-6 w-6" />
        </button>
    );

    return (
        <>
            <aside
                className={`fixed h-full z-50 bg-bgdark transition-all duration-300 ease-in-out flex flex-col 
                ${isMobile
                        ? mobileOpen
                            ? 'left-0 w-64'
                            : '-left-64 w-64'
                        : collapsed
                            ? 'w-16'
                            : 'w-64'
                    } lg:relative lg:left-0`}
            >
                {/* Sidebar header */}
                <div className="flex items-center justify-between h-16 px-4">
                    {(!collapsed || isMobile) ? (
                        <div className="flex items-center justify-between w-full overflow-hidden">
                            <div className="flex items-center justify-between w-full">
                                <img src='/assets/logo.png' alt="Logo" className="h-8 w-8 mr-2 flex-shrink-0" />
                                <span className="text-primary font-semibold whitespace-nowrap">Admin Panel</span>
                            </div>
                            {!isMobile && (
                                <button
                                    onClick={toggleSidebar}
                                    className="p-1 rounded-md text-secondary hover:text-primary focus:outline-none"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <img src="/assets/logo.png" alt="Logo" className="h-8 w-8 mx-auto" />
                            {!isMobile && (
                                <button
                                    onClick={toggleSidebar}
                                    className="p-1 rounded-md text-secondary hover:text-primary focus:outline-none"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Navigation links */}
                <nav className="flex-1 overflow-y-auto py-8">
                    <ul className="space-y-2 px-3">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <li key={item.path}>
                                    <NavLink
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `flex items-center p-3 rounded-lg transition-all duration-200 ${isActive
                                                ? 'bg-accent bg-opacity-15 text-bgdark shadow-md'
                                                : 'text-secondary hover:bg-gray-700 hover:bg-opacity-10 hover:text-primary'
                                            }`
                                        }
                                        onClick={() => isMobile && setMobileOpen(false)}
                                    >
                                        <Icon className="h-5 w-5 flex-shrink-0" />
                                        {(!collapsed || isMobile) && <span className="ml-3 whitespace-nowrap">{item.name}</span>}
                                    </NavLink>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User info at bottom */}
                <div className="p-4">
                    <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-bgdark flex-shrink-0">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        {(!collapsed || isMobile) && (
                            <div className="ml-3 overflow-hidden">
                                <p className="text-sm font-medium text-primary truncate">{user?.name || 'User'}</p>
                                <p className="text-xs text-secondary truncate">{user?.role || 'Admin'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isMobile && mobileOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-[25]"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile menu button */}
            {isMobile && <MobileMenuButton />}
        </>
    );
};

export default Sidebar;