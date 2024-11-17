import React, { useState } from 'react'
import Title from './Title'
import axios from 'axios';
import { backendUrl } from '../App'
import { toast } from 'react-toastify';

const Login = ({ setToken }) => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('')

    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault();
            const response = await axios.post(backendUrl + '/admin/login', { email, password })
            if (response.data.access_token) {
                setToken(response.data.access_token)
            } else {
                toast.error(response.data.message)
            }
        } catch (error) {
            // Access the response message from the backend
            const errorMessage = error.response?.data?.error || 'An unexpected error occurred';
            toast.error(errorMessage);
            console.log('Error:', errorMessage);
        }
    }
    return (
        <div className='min-h-screen flex items-center justify-center w-full'>
            <div className='px-8 py-10 max-w-md rounded-lg shadow-2xl border-border border'>
                <Title text1={'ADMIN'} text2={'PANEL'} />
                <form onSubmit={onSubmitHandler}>
                    <div className='mb-3 min-w-72'>
                        <p className='text-sm md:text-base font-medium text-secondary my-2'>Email Address</p>
                        <input onChange={(e) => setEmail(e.target.value)} value={email} type="email" placeholder='your@email.com' required className='w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded' />
                    </div>

                    <div className='mb-3 min-w-72'>
                        <p className='text-sm md:text-base font-medium text-secondary my-2'>Password</p>
                        <input onChange={(e) => setPassword(e.target.value)} value={password} type="password" placeholder='Enter your password' required className='w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded' />
                    </div>
                    <button type='submit' className='bg-accent  hover:bg-bgdark hover:text-accent hover:border border-accent rounded text-bgdark text-base mt-8 mb-3 py-3 px-11 w-full'>
                        Login
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Login
