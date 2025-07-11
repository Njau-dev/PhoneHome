import React, { createContext, useContext, useState } from 'react';
import { toast } from 'react-toastify';

// Create the app context
export const AppContext = createContext();

// Create a custom hook for using app context
export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    // App-wide settings
    const backendUrl = 'https://0d2b8047b32651.lhr.life';
    const currency = 'Kshs';

    // Notification helper
    const notify = {
        success: (message) => toast.success(message),
        error: (message) => toast.error(message),
        info: (message) => toast.info(message),
        warning: (message) => toast.warning(message),
    };

    const value = {
        backendUrl,
        currency,
        notify,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};