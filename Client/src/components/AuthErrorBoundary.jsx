import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const AuthErrorBoundary = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Add axios interceptor for response errors
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Clear local storage
                    localStorage.removeItem('token');

                    // Show error message
                    toast.error('Session expired. Please login again.');

                    // Redirect to login
                    navigate('/login');
                }
                return Promise.reject(error);
            }
        );

        // Cleanup interceptor on unmount
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [navigate]);

    return null;
};

export default AuthErrorBoundary;