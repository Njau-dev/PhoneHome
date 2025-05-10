import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingCart, Heart, RefreshCcw } from 'lucide-react';

const NotificationPopup = ({ type, message, onClose, product }) => {
    const [isVisible, setIsVisible] = useState(true);

    // Set automatic close timer
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for fade-out animation before removing
        }, 10000); // 10 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    // Handle close button click
    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    // Get appropriate icon and link based on notification type
    const getNotificationDetails = () => {
        switch (type) {
            case 'cart':
                return {
                    icon: <ShoppingCart size={18} />,
                    linkText: 'View Cart',
                    linkTo: '/cart',
                    bgColor: 'bg-accent'
                };
            case 'wishlist':
                return {
                    icon: <Heart size={18} />,
                    linkText: 'View Wishlist',
                    linkTo: '/wishlist',
                    bgColor: 'bg-accent'
                };
            case 'compare':
                return {
                    icon: <RefreshCcw size={18} />,
                    linkText: 'Compare Products',
                    linkTo: '/compare',
                    bgColor: 'bg-accent'
                };
            default:
                return {
                    icon: <ShoppingCart size={18} />,
                    linkText: 'View Cart',
                    linkTo: '/cart',
                    bgColor: 'bg-accent'
                };
        }
    };

    const { icon, linkText, linkTo, bgColor } = getNotificationDetails();

    return (
        <div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
        >
            <div className="bg-bgdark border border-border rounded-lg shadow-lg shadow-black/30 w-72 overflow-hidden">
                {/* Header with icon and close button */}
                <div className={`${bgColor} px-4 py-2 flex justify-between items-center text-bgdark`}>
                    <div className="flex items-center gap-2">
                        {icon}
                        <span className="font-medium">Success</span>
                    </div>
                    <button onClick={handleClose} className="hover:bg-black/10 p-1 rounded-full">
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Product info if available */}
                    {product && (
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-border rounded-md overflow-hidden flex-shrink-0">
                                <img
                                    src={product.image_urls[0]}
                                    alt={product.name}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <h4 className="text-primary text-sm font-medium truncate">{product.name}</h4>
                                {product.price && (
                                    <p className="text-accent text-xs">
                                        Kshs {product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Message */}
                    <p className="text-primary text-sm mb-3">{message}</p>

                    {/* Link button */}
                    <Link
                        to={linkTo}
                        className="block w-full bg-accent hover:bg-bgdark text-center py-2 px-4 rounded-lg text-bgdark hover:text-accent border border-transparent hover:border-accent transition-all text-sm font-medium"
                    >
                        {linkText}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotificationPopup;