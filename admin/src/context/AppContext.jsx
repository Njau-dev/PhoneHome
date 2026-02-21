import React, { createContext, useContext, useState } from 'react';
import { toast } from 'react-toastify';

// Create the app context
export const AppContext = createContext();

// Create a custom hook for using app context
export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    // App-wide settings
    // const backendUrl = 'https://api.phonehome.co.ke/api';
    const backendUrl = 'http://localhost:5000/api';
    const currency = 'Kshs';

    // Notification helpers
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