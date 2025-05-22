import React from 'react';
import { AuthProvider } from './AuthContext';
import { AppProvider } from './AppContext';

// Combine all providers into one component
export const ContextProviders = ({ children }) => {
    return (
        <AppProvider>
            <AuthProvider>
                {children}
            </AuthProvider>
        </AppProvider>
    );
};