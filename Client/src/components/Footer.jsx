import React from 'react'

const Footer = () => {
    return (
        <div>
            <div className='flex flex-col sm:grid grid-cols-[2fr_1fr_1fr] gap-14 sm:gap-4 mb-8 mt-12 sm:mt-12 md:mt-28 text-sm border-t-2 border-border sm:pt-7 sm:pl-2'>
                <div>
                    <img src='/assets/logo.png' className='my-5 w-32' alt="Logo" />
                    <p className='w-full md:w-2/3 text-primary'>Phone Home is a shop based in Nairobi, Kenya which focuses on delivering quality products namely Phones, Tablets, Laptops, Audio devices and services to their clients all over Kenya.</p>
                </div>

                <div>
                    <p className='text-xl font-medium mb-5'>PHONE HOME</p>
                    <ul className='flex flex-col gap-2 text-primary'>
                        <li className=''>Home</li>
                        <li className=''>Contacts</li>
                        <li className=''>Delivery</li>
                        <li className=''>Privacy Policy</li>
                    </ul>
                </div>

                <div>
                    <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
                    <ul className='flex flex-col gap-2 text-primary'>
                        <li>+254-701-688957</li>
                        <li>+254-705-984048</li>
                        <li>+254-723-503101</li>
                        <li>phonehome@kenya.com</li>
                    </ul>
                </div>


            </div>


            <div>
                <hr className='border-border' />
                <p className='py-5 text-sm text-center text-secondary font-light'>Copyright 2024@ phonehome.co.ke - All Rights Reserved</p>
            </div>
        </div>
    )
}

export default Footer
