import { useContext, useState } from 'react'
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Title from './Title';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { navigate, backendUrl } = useContext(ShopContext);

    const onSubmitHandler = async (event) => {
        event.preventDefault();

        try {
            const response = await axios.post(backendUrl + '/forgot-password', { email });

            if (response.status === 200) {
                toast.success(response.data.Message || 'Password reset email sent successfully');
                setIsSubmitted(true);
            }
        } catch (error) {
            // Handle errors and runtime issues
            if (error.response) {
                const { status, data } = error.response;

                // Backend errors based on status codes
                if (status === 400) {
                    toast.error('Email is required.');
                } else if (status === 404) {
                    toast.error('User with this email does not exist.');
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

    return (
        <form onSubmit={onSubmitHandler} className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-primary'>
            <div className='inline-flex items-center gap-2 mb-2 mt-10'>
                <div className=" text-center text-[27px] sm:text-3xl">
                    <Title text1={'FORGOT'} text2={'PASSWORD'} />
                </div>
            </div>

            {!isSubmitted ? (
                <>
                    <p className='text-sm text-secondary mb-2'>
                        Enter your email address and we'll send you a link to reset your password.
                    </p>

                    <input
                        type="email"
                        placeholder='Email'
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        className='w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded'
                        required
                    />

                    <div className='w-full flex justify-between text-sm mt-4'>
                        <p className='cursor-pointer hover:text-accent' onClick={() => navigate('/login')}>Back to Login</p>
                    </div>

                    <button className='bg-accent hover:bg-bgdark hover:text-accent hover:border border-accent rounded text-bgdark text-base mt-8 mb-3 py-3 px-11'>
                        Send Reset Link
                    </button>
                </>
            ) : (
                <>
                    <div className='text-center p-4'>
                        <p className='mb-4'>Password reset link has been sent to your email.</p>
                        <p className='text-sm text-secondary'>Please check your inbox and follow the instructions.</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className='bg-accent hover:bg-bgdark hover:text-accent hover:border border-accent rounded text-bgdark text-base mt-8 mb-3 py-3 px-11'
                    >
                        Back to Login
                    </button>
                </>
            )}
        </form>
    )
}

export default ForgotPassword