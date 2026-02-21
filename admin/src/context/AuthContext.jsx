import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useApp } from './AppContext';

// Create the authentication context
export const AuthContext = createContext();

// Create a custom hook for using auth context
export const useAuth = () => useContext(AuthContext);

const getStoredUser = () => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) {
        return null;
    }

    try {
        return JSON.parse(rawUser);
    } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [user, setUser] = useState(getStoredUser);
    const [loading, setLoading] = useState(false);
    const { backendUrl } = useApp()
    const navigate = useNavigate();

    // Update localStorage when token changes
    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }

        if (user && token) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
        }
    }, [token, user]);

    // Real login function using API
    const login = async (email, password) => {
        setLoading(true);
        try {
            const response = await axios.post(backendUrl + '/auth/admin/login', {
                email,
                password
            });

            const accessToken = response.data?.data?.token;
            const userData = response.data?.data?.user;

            if (accessToken && userData?.role === 'admin') {
                setToken(accessToken);
                setUser(userData);

                toast.success('Login successful!');
                navigate('/dashboard');
                return true;
            } else {
                toast.error(response.data.message || 'Login failed');
                return false;
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'An unexpected error occurred';
            console.error('Login error:', errorMessage);
            toast.error(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Setup axios interceptor for 401 errors
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Token expired or invalid
                    logout();
                    toast.error('Session expired. Please login again.');
                }
                return Promise.reject(error);
            }
        );

        // Cleanup interceptor on unmount
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    // Logout function
    const logout = () => {
        setToken('');
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Only show toast if there was actually a user logged in
        if (!!token) {
            toast.info('Logged out successfully');
        }

        navigate('/login');
    };

    // Check if user is authenticated
    const isAuthenticated = () => {
        return !!token && user?.role === 'admin';
    };

    const value = {
        token,
        user,
        loading,
        login,
        logout,
        isAuthenticated,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
