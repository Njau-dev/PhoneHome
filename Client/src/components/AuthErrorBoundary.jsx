import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShopContext } from '../context/ShopContext';

const AuthErrorBoundary = () => {
    const navigate = useNavigate();
    const { setToken, setCartItems, setWishlistItems, setCompareItems } = useContext(ShopContext);

    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Clear all auth-related state
                    setToken(null);
                    setCartItems({});
                    setWishlistItems([]);
                    setCompareItems([]);

                    // Clear localStorage
                    localStorage.clear();

                    // Show error message
                    toast.error('Session expired. Please login again.', {
                        toastId: 'session-expired'
                    });

                    // Force redirect to login
                    navigate('/login', { replace: true });
                }
                return Promise.reject(error);
            }
        );

        // Cleanup interceptor on unmount
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [navigate, setToken, setCartItems, setWishlistItems, setCompareItems]);

    return null;
};

export default AuthErrorBoundary;