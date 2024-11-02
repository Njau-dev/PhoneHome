import React, { useContext, useState } from 'react'
import Logo from '/src/assets/logo.png'
import { NavLink } from 'react-router-dom'
import { ArrowLeftCircleIcon, Bars3BottomRightIcon, MagnifyingGlassIcon, ShoppingBagIcon, UserIcon } from '@heroicons/react/24/outline'
import { ShopContext } from '../context/ShopContext'


const Navbar = () => {

    const [visible, setVisible] = useState(false);

    const { setShowSearch, getCartCount } = useContext(ShopContext);

    return (

        <div className='flex items-center justify-between py-3 font-medium Nav'>

            <NavLink to='/'>
                <img src={Logo} alt="Logo" className='w-28' />
            </NavLink>

            <ul className='hidden sm:flex gap-5 text-sm text-primary'>

                <NavLink to='/' className='flex flex-col items-center gap-1'>
                    <p className='nav-links'>HOME</p>
                    <hr className='w-2/4 border-none h-[1.5px] bg-accent hidden' />
                </NavLink>

                <NavLink to='/collection' className='flex flex-col items-center gap-1'>
                    <p className='nav-links'>COLLECTION</p>
                    <hr className='w-2/4 border-none h-[1.5px] bg-accent hidden' />
                </NavLink>

                <NavLink to='/contact' className='flex flex-col items-center gap-1'>
                    <p className='nav-links'>CONTACT</p>
                    <hr className='w-2/4 border-none h-[1.5px] bg-accent hidden' />
                </NavLink>

                {/* <NavLink to='/admin' className='flex flex-col items-center gap-1'>
                <p className='nav-links'>Admin Panel</p>
                <hr className='w-2/4 border-none h-[1.5px] bg-accent hidden'/>
            </NavLink> */}

            </ul>

            <div className='flex items-center gap-5'>
                <NavLink to='/collection'>
                    <MagnifyingGlassIcon onClick={() => setShowSearch(true)} className="w-6 icons hover:text-accent" />
                </NavLink>

                <div className="group relative">

                    <NavLink to='/login'>
                        <UserIcon className='w-6 icons hover:text-accent' />
                    </NavLink>

                    <div className="group-hover:block hidden absolute dropdown-menu right-[-2rem] pt-4 ">
                        <div className="flex flex-col gap-2 w-36 py-3 px-5 bg-border text-primary rounded border-border">
                            <p>My Profile</p>
                            <p>Orders</p>
                            <p>Logout</p>
                        </div>
                    </div>
                </div>



                <NavLink to='/cart' className='relative'>
                    <ShoppingBagIcon className='w-6 icons hover:text-accent' />
                    <p className='absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-accent text-bgdark aspect-square rounded-full text-[10px]'>{getCartCount()}</p>
                </NavLink>

                <Bars3BottomRightIcon onClick={() => setVisible(true)} className='size-6 cursor-pointer sm:hidden' />
            </div>


            {/* Sidebar Menu for responsive screen */}

            <div className={`${visible ? 'w-full' : 'w-0'} absolute top-0 right-0 bottom-0 left-0 overflow-hidden bg-bgdark transition-all`}>
                <div className="flex flex-col text-primary">
                    <div onClick={() => setVisible(false)} className="flex flex-col justify-between gap-4 p-3 cursor-pointer">

                        <div className='flex items-center justify-between'>
                            <img src={Logo} alt="Logo" className='w-28' />

                            <div className='flex items-center'>
                                <ArrowLeftCircleIcon className='h-5 text-accent mx-2' />
                                <p>Back</p>
                            </div>
                        </div>

                        <NavLink className='py-2 pl-6 border border-border' to='/'>HOME</NavLink>
                        <NavLink className='py-2 pl-6 border border-border' to='/collection'>COLLECTION</NavLink>
                        <NavLink className='py-2 pl-6 border border-border' to='/contact'>CONTACT</NavLink>

                    </div>
                </div>
            </div>
        </div>

    )
}

export default Navbar
