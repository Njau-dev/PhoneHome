import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ children }) => {
    const navigate = useNavigate();
    const { token } = useContext(ShopContext);

    useEffect(() => {
        if (!token) {
            toast.error('Please login to access this page', {
                toastId: 'auth-required'
            });
            navigate('/login', { replace: true });
        }
    }, [token, navigate]);

    return token ? children : null;
};

export default ProtectedRoute;