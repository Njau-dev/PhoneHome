import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLocation } from 'react-router-dom';

const SearchBar = () => {

  const { search, setSearch, showSearch, setShowSearch } = useContext(ShopContext);

  const [visible, setVisible] = useState(false)
  //useLocation to locate which path we,re on and hide components efficiently

  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes('collection') && showSearch) {
      setVisible(true)
    }
    else {
      setVisible(false)
    }

  }, [location, showSearch])

  return showSearch && visible ? (
    <div className='border-t border-border bg-bgdark text-center'>
      <div className='inline-flex items-center justify-center border border-border px-5 py-2 my-5 mx-3 rounded-full w-3/4 sm:w-1/2'>
        <input className='flex-1 outline-none bg-inherit text-sm' value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder='Search' />

        <MagnifyingGlassIcon className='w-4 text-accent' />
      </div>

      <XMarkIcon onClick={() => setShowSearch(false)} className='inline w-6 cursor-pointer' />

    </div>
  ) : null
}

export default SearchBar
