import React, { createContext, useState, useContext } from 'react';
import NotificationPopup from '../components/NotificationPopup';

// Create context
export const NotificationContext = createContext();

// Create provider component
export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    // Add a new notification
    const addNotification = (type, message, product = null) => {
        const newNotification = {
            id: Date.now(), // Use timestamp as unique ID
            type,
            message,
            product
        };

        setNotifications(prev => [...prev, newNotification]);
    };

    // Remove a notification by ID
    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    // Convenience methods for specific notification types
    const notifyCart = (message, product = null) => {
        addNotification('cart', message, product);
    };

    const notifyWishlist = (message, product = null) => {
        addNotification('wishlist', message, product);
    };

    const notifyCompare = (message, product = null) => {
        addNotification('compare', message, product);
    };

    const value = {
        notifyCart,
        notifyWishlist,
        notifyCompare
    }

    return (
        <NotificationContext.Provider
            value={value}
        >
            {children}

            {/* Render active notifications */}
            {notifications.map(notification => (
                <NotificationPopup
                    key={notification.id}
                    type={notification.type}
                    message={notification.message}
                    product={notification.product}
                    onClose={() => removeNotification(notification.id)}
                />
            ))}
        </NotificationContext.Provider>
    );
};

// Custom hook for using the notification context
export const useNotification = () => useContext(NotificationContext);