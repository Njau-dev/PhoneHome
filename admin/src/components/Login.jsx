import React, { useState } from 'react';
import Title from './Title';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading } = useAuth();
    const navigate = useNavigate();


    const onSubmitHandler = async (e) => {
        e.preventDefault();
        const success = await login(email, password);
        if (success) {
            navigate('/dashboard');
        }
    };

    return (
        <div className='min-h-screen flex items-center justify-center w-full'>
            <div className='px-8 py-10 max-w-md rounded-lg shadow-2xl border-border border'>
                <Title text1={'ADMIN'} text2={'PANEL'} />
                <form onSubmit={onSubmitHandler}>
                    <div className='mb-3 min-w-72'>
                        <p className='text-sm md:text-base font-medium text-secondary my-2'>Email Address</p>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            type="email"
                            placeholder='your@email.com'
                            required
                            className='w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded'
                        />
                    </div>

                    <div className='mb-3 min-w-72'>
                        <p className='text-sm md:text-base font-medium text-secondary my-2'>Password</p>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            type="password"
                            placeholder='Enter your password'
                            required
                            className='w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded'
                        />
                    </div>
                    <button
                        type='submit'
                        disabled={loading}
                        className='bg-accent hover:bg-bgdark hover:text-accent hover:border border-accent rounded text-bgdark text-base mt-8 mb-3 py-3 px-11 w-full'
                    >
                        {loading ? 'Loading...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;