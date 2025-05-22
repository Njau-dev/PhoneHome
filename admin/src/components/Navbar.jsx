import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, User, LogOut } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };

        // Check if screen is mobile
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', checkIfMobile);
        checkIfMobile(); // Check on initial load

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', checkIfMobile);
        };
    }, []);

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);


    return (
        <nav className={`sticky top-0 z-30 transition-all duration-300 ${isScrolled ? 'bg-bgdark/80 backdrop-blur-lg shadow-lg' : 'bg-bgdark'}`}>

            <div className="mx-auto px-4 sm:px-6">
                <div className="flex justify-between items-center h-16">

                    {/* Logo - Only visible on mobile */}
                    {isMobile && (
                        <div className="flex items-center">
                            <img src='/assets/logo.png' alt="Logo" className="h-8 w-8" />
                        </div>
                    )}


                    <div className="flex items-center space-x-4 ml-auto">
                        {/* Notifications */}
                        <button className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-gray-700/10 transition-colors focus:outline-none relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                        </button>
                        {/* User dropdown */}
                        <div className="relative">
                            <button
                                onClick={toggleDropdown}
                                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700/10 transition-colors focus:outline-none"
                            >
                                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-bgdark shadow-md">
                                    {user?.name?.charAt(0) || <User className="h-5 w-5" />}
                                </div>
                                <div className="hidden md:block">
                                    <div className="text-sm font-medium text-primary">
                                        {user?.name || 'User'}
                                    </div>
                                    <div className="text-xs text-secondary">
                                        {user?.role || 'Admin'}
                                    </div>
                                </div>
                            </button>
                            {/* Dropdown menu */}
                            {isDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-30"
                                        onClick={() => setIsDropdownOpen(false)}
                                    ></div>
                                    <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-bgdark z-40">
                                        <div className="py-1 rounded-lg overflow-hidden">
                                            <div className="px-4 py-3 border-b border-gray-700/20">
                                                <p className="text-sm font-medium text-primary">{user?.name || 'User'}</p>
                                                <p className="text-xs text-secondary truncate">{user?.email || 'user@example.com'}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    logout();
                                                }}
                                                className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                            >
                                                <LogOut className="h-4 w-4 mr-2" />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </nav>
    );
};

export default Navbar;