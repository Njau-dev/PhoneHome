import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useApp } from './AppContext';

// Create the authentication context
export const AuthContext = createContext();

// Create a custom hook for using auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [user, setUser] = useState(localStorage.getItem('user') || '');
    const [loading, setLoading] = useState(false);
    const { backendUrl } = useApp()
    const navigate = useNavigate();

    // Update localStorage when token changes
    useEffect(() => {
        localStorage.setItem('token', token);
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    }, [token, user]);

    // Real login function using API
    const login = async (email, password) => {
        setLoading(true);
        try {
            const response = await axios.post(backendUrl + '/admin/login', {
                email,
                password
            });

            if (response.data.access_token) {
                setToken(response.data.access_token);
                setUser(response.data.user);

                toast.success('Login successful!');
                navigate('/dashboard');
                return true;
            } else {
                toast.error(response.data.message || 'Login failed');
                return false;
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'An unexpected error occurred';
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
        setUser('');
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
        return !!token;
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