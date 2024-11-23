import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Login = () => {

  const [currentState, setCurrentState] = useState('Login');
  const { navigate, setToken, token, backendUrl } = useContext(ShopContext)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [phone_number, setPhone_number] = useState('')

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    try {
      if (currentState === 'Sign Up') {

        const response = await axios.post(backendUrl + '/signup', { username, email, password, phone_number })

        if (response.status === 201) {
          toast.success(response.data.Message);
        }

      } else {

        const response = await axios.post(backendUrl + '/login', { email, password })

        if (response.status === 200) {
          toast.success(response.data.Message)
          setToken(response.data.token)
          localStorage.setItem('token', response.data.token)
        }
      }

    } catch (error) {
      // Handle errors and runtime issues
      if (error.response) {
        const { status, data } = error.response;

        // Backend errors based on status codes
        if (status === 400) {
          toast.error('Missing required fields.');
        } else if (status === 409) {
          toast.error('User already exists.');
        } else if (status === 500) {
          toast.error('Error while signing up, please try again.');
        } else {
          toast.error(data.Error || 'Unexpected error occurred.');
        }
      } else {
        // Network or runtime error
        toast.error('Network error, please check your connection.');
      }
    }
  }

  useEffect(() => {
    if (token) {
      navigate('/')
    }
  }, [token])

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-primary'>
      <div className='inline-flex items-center gap-2 mb-2 mt-10'>
        <p className='prata-regular text-3xl'>{currentState}</p>
        <hr className='border-none h-[1.5px] w-8 bg-secondary' />
      </div>

      {currentState === 'Login' ? '' : <input type="text" placeholder='Username' onChange={(e) => setUsername(e.target.value)} value={username} className='w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded' required />}


      <input type="email" placeholder='Email' onChange={(e) => setEmail(e.target.value)} value={email} className='w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded' required />

      <input type="password" placeholder='Password' onChange={(e) => setPassword(e.target.value)} value={password} className='w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded' required />

      {currentState === 'Login' ? '' : <input type="number" placeholder='Phone Number' onChange={(e) => setPhone_number(e.target.value)} value={phone_number} className='w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded' required />}

      <div className='w-full flex justify-between text-sm mt-[-8px]'>
        <p className='cursor-pointer'>Forgot your password</p>
        {
          currentState === 'Login'
            ? <p className='cursor-pointer' onClick={() => setCurrentState('Sign Up')}>Create Account</p>
            : <p className='cursor-pointer' onClick={() => setCurrentState('Login')}>Login Here</p>
        }
      </div>

      <button className='bg-accent  hover:bg-bgdark hover:text-accent hover:border border-accent rounded text-bgdark text-base mt-8 mb-3 py-3 px-11'>{currentState === 'Login' ? 'Sign In' : 'Sign Up'}</button>

    </form>
  )
}

export default Login
