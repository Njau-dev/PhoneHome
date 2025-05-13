import { useContext, useState, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import Title from './Title';

const ResetPassword = () => {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isValidToken, setIsValidToken] = useState(true); // Assume token is valid initially
    const [isReset, setIsReset] = useState(false);
    const { navigate, backendUrl } = useContext(ShopContext);

    // Validate token on component mount
    useEffect(() => {
        // You could optionally validate the token with an API call here
        // For now, we'll just check if it exists
        if (!token) {
            setIsValidToken(false);
            toast.error('Invalid or missing reset token');
        }
    }, [token]);

    const onSubmitHandler = async (event) => {
        event.preventDefault();

        // Validate passwords match
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        // Check password strength (optional)
        if (password.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        try {
            const response = await axios.post(`${backendUrl}/reset-password/${token}`, { password });

            if (response.status === 200) {
                toast.success(response.data.Message || 'Password reset successfully');
                setIsReset(true);
            }
        } catch (error) {
            // Handle errors and runtime issues
            if (error.response) {
                const { status, data } = error.response;

                // Backend errors based on status codes
                if (status === 400) {
                    toast.error('Password is required.');
                } else if (status === 401) {
                    toast.error('Invalid or expired token.');
                    setIsValidToken(false);
                } else if (status === 500) {
                    toast.error('Server error, please try again later.');
                } else {
                    toast.error(data.Error || 'Unexpected error occurred.');
                }
            } else {
                // Network or runtime error
                toast.error('Network error, please check your connection.');
            }
        }
    }

    if (!isValidToken) {
        return (
            <div className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-primary'>
                <div className='inline-flex items-center gap-2 mb-2 mt-10'>
                    <p className='prata-regular text-3xl'>Invalid Token</p>
                    <hr className='border-none h-[1.5px] w-8 bg-secondary' />
                </div>

                <p className='text-center mb-4'>The password reset link is invalid or has expired.</p>

                <button
                    onClick={() => navigate('/forgot-password')}
                    className='bg-accent hover:bg-bgdark hover:text-accent hover:border border-accent rounded text-bgdark text-base mt-8 mb-3 py-3 px-11'
                >
                    Request New Link
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={onSubmitHandler} className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-primary'>
            <div className='inline-flex items-center gap-2 mb-2 mt-10'>
                <div className=" text-center text-[27px] sm:text-3xl">
                    <Title text1={'RESET'} text2={'PASSWORD'} />
                </div>
            </div>

            {!isReset ? (
                <>
                    <p className='text-sm text-secondary mb-2'>
                        Enter your new password below.
                    </p>

                    <input
                        type="password"
                        placeholder='New Password'
                        onChange={(e) => setPassword(e.target.value)}
                        value={password}
                        className='w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded'
                        required
                    />

                    <input
                        type="password"
                        placeholder='Confirm New Password'
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        value={confirmPassword}
                        className='w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded'
                        required
                    />

                    <button className='bg-accent hover:bg-bgdark hover:text-accent hover:border border-accent rounded text-bgdark text-base mt-8 mb-3 py-3 px-11'>
                        Reset Password
                    </button>
                </>
            ) : (
                <>
                    <div className='text-center p-4'>
                        <p className='mb-4'>Your password has been reset successfully!</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className='bg-accent hover:bg-bgdark hover:text-accent hover:border border-accent rounded text-bgdark text-base mt-8 mb-3 py-3 px-11'
                    >
                        Login with New Password
                    </button>
                </>
            )}
        </form>
    )
}

export default ResetPassword