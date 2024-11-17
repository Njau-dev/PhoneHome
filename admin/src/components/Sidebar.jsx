import { ArchiveBoxIcon, ListBulletIcon, PlusCircleIcon } from '@heroicons/react/24/outline'
import React from 'react'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
    return (
        <div className='w-[18%] min-h-screen border-r-2 border-border'>
            <div className='flex flex-col gap-4 pt-6 pl-[20%] text-base'>
                <NavLink className='flex items-center gap-3 border border-border border-r-0 rounded-r-none px-3 py-2 rounded-md text-accent' to='/add'>
                    <PlusCircleIcon className='size-6' />
                    <p className='hidden md:block'>Add Items</p>
                </NavLink>

                <NavLink className='flex items-center gap-3 border border-border border-r-0 rounded-r-none px-3 py-2 rounded-md text-accent' to='/list'>
                    <ListBulletIcon className='size-6' />
                    <p className='hidden md:block'>List Items</p>
                </NavLink>

                <NavLink className='flex items-center gap-3 border border-border border-r-0 rounded-r-none px-3 py-2 rounded-md text-accent' to='/orders'>
                    <ArchiveBoxIcon className='size-6' />
                    <p className='hidden md:block'>Orders Items</p>
                </NavLink>
            </div>
        </div>
    )
}

export default Sidebar
