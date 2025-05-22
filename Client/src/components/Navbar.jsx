import { useContext, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ArrowLeftCircleIcon, Bars3BottomRightIcon, MagnifyingGlassIcon, ShoppingBagIcon, UserIcon } from '@heroicons/react/24/outline'
import { ShopContext } from '../context/ShopContext'


const Navbar = () => {

    const [visible, setVisible] = useState(false);

    const { setShowSearch, getCartCount, navigate, token, setToken, setCartItems, user, setUser } = useContext(ShopContext);

    const logout = () => {
        localStorage.removeItem('token')
        setToken('')
        localStorage.removeItem('user')
        setUser(null)
        setCartItems({})
        navigate('/login')
    }

    return (

        <div className='flex items-center justify-between py-3 font-medium Nav'>

            <NavLink to='/'>
                <img src='/assets/logo.png' alt="Logo" className='w-28' />
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

                <NavLink to='/compare' className='flex flex-col items-center gap-1'>
                    <p className='nav-links'>COMPARE</p>
                    <hr className='w-2/4 border-none h-[1.5px] bg-accent hidden' />
                </NavLink>

                <NavLink to='/contact' className='flex flex-col items-center gap-1'>
                    <p className='nav-links'>CONTACT</p>
                    <hr className='w-2/4 border-none h-[1.5px] bg-accent hidden' />
                </NavLink>

                {/* Admin Panel Link - Only visible for admin users */}
                {user?.role === 'admin' && (
                    <a
                        href="https://admin.phonehome.co.ke"
                        target="_blank"
                        rel="noopener noreferrer"
                        className='flex flex-col items-center gap-1'
                    >
                        <p className='nav-links'>ADMIN</p>
                        <hr className='w-2/4 border-none h-[1.5px] bg-accent hidden' />
                    </a>
                )}

            </ul>

            <div className='flex items-center gap-5'>
                <NavLink to='/collection'>
                    <MagnifyingGlassIcon onClick={() => setShowSearch(true)} className="w-6 icons hover:text-accent" />
                </NavLink>

                <div className="group relative">


                    <UserIcon onClick={() => token ? null : navigate('/login')} className='w-6 icons hover:text-accent' />

                    {/* dropdown menu */}

                    {token &&
                        <div className="group-hover:block hidden absolute dropdown-menu right-[-2rem] pt-4 z-20">
                            <div className="flex flex-col gap-2 w-36 py-3 px-5 bg-bgdark text-primary rounded border border-border">
                                <p onClick={() => navigate('/profile')} className='cursor-pointer hover:text-accent'>My profile</p>
                                <p onClick={() => navigate('/wishlist')} className='cursor-pointer hover:text-accent'>My wishlist</p>
                                <p onClick={() => navigate('/orders')} className='cursor-pointer hover:text-accent'>My orders</p>
                                <p onClick={logout} className='cursor-pointer hover:text-accent'>Logout</p>
                            </div>
                        </div>
                    }

                </div>



                <NavLink to='/cart' className='relative'>
                    <ShoppingBagIcon className='w-6 icons hover:text-accent' />
                    <p className='absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-accent text-bgdark aspect-square rounded-full text-[10px]'>{getCartCount()}</p>
                </NavLink>

                <Bars3BottomRightIcon onClick={() => setVisible(true)} className='size-6 cursor-pointer sm:hidden' />
            </div>


            {/* Sidebar Menu for responsive screen */}

            <div className={`${visible ? 'w-full' : 'w-0'} absolute z-40 top-0 right-0 bottom-0 left-0 overflow-hidden bg-bgdark transition-all`}>
                <div className="flex flex-col text-primary">
                    <div onClick={() => setVisible(false)} className="flex flex-col justify-between gap-4 p-3 cursor-pointer">

                        <div className='flex items-center justify-between'>
                            <img src='/assets/logo.png' alt="Logo" className='w-28' />

                            <div className='flex items-center'>
                                <ArrowLeftCircleIcon className='h-5 text-accent mx-2' />
                                <p>Back</p>
                            </div>
                        </div>

                        <NavLink className='py-2 pl-6 border border-border' to='/'>HOME</NavLink>
                        <NavLink className='py-2 pl-6 border border-border' to='/collection'>COLLECTION</NavLink>
                        <NavLink className='py-2 pl-6 border border-border' to='/compare'>COMPARE</NavLink>
                        <NavLink className='py-2 pl-6 border border-border' to='/contact'>CONTACT</NavLink>

                    </div>
                </div>
            </div>
        </div>

    )
}

export default Navbar
