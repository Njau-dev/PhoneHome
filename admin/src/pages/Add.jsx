import { CloudArrowUpIcon } from '@heroicons/react/24/outline'
import React from 'react'

const Add = () => {
    return (
        <form className='flex flex-col w-full items-start gap-3'>
            <div>
                <p className='mb-2'>Upload Image</p>

                <div className='flex gap-2'>
                    <label htmlFor="image1">
                        <CloudArrowUpIcon className='w-16 md:w-20 bg-bgdark p-2 border border-border hover:border-accent cursor-pointer rounded-lg' />
                        <input type="file" id='image1' hidden />
                    </label>

                    <label htmlFor="">
                        <CloudArrowUpIcon className='w-16 md:w-20 bg-bgdark p-2 border border-border hover:border-accent cursor-pointer rounded-lg' />
                        <input type="file" id='' hidden />
                    </label>

                    <label htmlFor="">
                        <CloudArrowUpIcon className='w-16 md:w-20 bg-bgdark p-2 border border-border hover:border-accent cursor-pointer rounded-lg' />
                        <input type="file" id='' hidden />
                    </label>

                    <label htmlFor="">
                        <CloudArrowUpIcon className='w-16 md:w-20 bg-bgdark p-2 border border-border hover:border-accent cursor-pointer rounded-lg' />
                        <input type="file" id='' hidden />
                    </label>

                </div>
            </div>

            <div className='w-full'>
                <p className='mb-2'>Product name</p>
                <input type="text" placeholder='Type here' className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300' />
            </div>

            <div className='w-full'>
                <p className='mb-2'>Product description</p>
                <textarea type="text" placeholder='Write content here' className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300' />
            </div>

            <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>
                <div>
                    <p className='mb-2'>Product Category</p>
                    <select className='w-full px-3 py-2'>
                        <option value="phones">Phone</option>
                        <option value="tablet">Tablet</option>
                        <option value="laptop">Laptop</option>
                        <option value="audio">Audio</option>
                    </select>
                </div>

                <div>
                    <p className='mb-2'>Product Brand</p>
                    <select className='w-full px-3 py-2'>
                        <option value="phones">Phone</option>
                        <option value="tablet">Tablet</option>
                        <option value="laptop">Laptop</option>
                        <option value="audio">Audio</option>
                    </select>
                </div>

                <div>
                    <p className='mb-2'>Price</p>
                    <input className='w-full sm:w-[120px] px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300' type="number" placeholder='10,000' />
                </div>
            </div>

            <div className='w-full mt-4'>
                <p className='mb-2'>Product Variations</p>
                <div className='flex flex-col gap-2'>
                    <div className='flex gap-2'>
                        <input type="text" placeholder='RAM (e.g., 8GB)' className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent' />
                        <input type="text" placeholder='Storage (e.g., 128GB)' className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent' />
                        <input type="number" placeholder='Variation Price' className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent' />
                    </div>
                    <button type='button' className='px-4 py-2 bg-accent text-white rounded-lg'>Add Variation</button>
                </div>
            </div>


            <div>
                <p></p>
            </div>
        </form>
    )
}

export default Add
