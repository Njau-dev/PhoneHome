import React from 'react'
import HeroImage from '/src/assets/Samsung/hero-3.jpg'

const Hero = () => {
  return (
    <div className='flex flex-col sm:flex-row border border-border'>
          
      {/* Left side */}
        <div className='w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0'>
            <div className='text-border'>
                <div className='flex items-center gap-2'>
                    <p className='w-8 md:w-11 h-[2px] bg-primary'></p>
                    <p className='font-medium text-sm md:text-lg'>OUR BESTSELLERS</p>
                </div>
                <h1 className='prata-regular text-3xl sm:py-3 lg:text-5xl leading-relaxed text-primary'>Latest Arrivals</h1>
                <div className='flex items-center gap-2'>
                    <p className='font-semibold text-sm md:text-lg'>SHOP NOW</p>
                    <p className='w-8 md:w-11 h-[2px] bg-primary'></p>
                </div>
            </div>
              
        </div>
          
      {/* Right image holder */}
          
      <img src={HeroImage} className='w-100 sm:w-1/2' alt="" />
          
    </div>
  )
}

export default Hero
