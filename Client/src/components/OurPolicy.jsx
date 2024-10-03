import React from "react"
import qualityIcon from '/home/njau/Documents/Projects/PhoneHome/Client/src/assets/icons/premium.png';
import shippingIcon from '/home/njau/Documents/Projects/PhoneHome/Client/src/assets/icons/fast-delivery.png'
import discountIcon from '/home/njau/Documents/Projects/PhoneHome/Client/src/assets/icons/discount.png'
import Title from "./Title";

const OurPolicy = () => {
  return (
    <div className="text-center">

      <Title text1={'WHY'} text2={'CHOOSE US'}/>

      <div className='flex flex-col sm:flex-row justify-around gap-12 sm:gap-6 text-center py-20 text-sm sm:text-md md:text-base text-primary w-4/5 m-auto'>
        <div>
      
          <img src={shippingIcon} alt="" className='w-24 m-auto mb-5 hover:scale-110 transition ease-in-out' />
      
          <p className='font-semibold text-base md:text-xl lg:text-2xl my-5'>Same-Day Delivery</p>
          <p className='font-extralight'>
              Same-day delivery for orders within Nairobi and free delivery for orders above Kshs 50k.
          </p>
        </div>
      
        <div>
          <img src={qualityIcon} alt="quality" className='w-24 m-auto mb-5 hover:scale-110 transition ease-in-out'/>
      
      
          <p className='font-semibold text-base md:text-xl lg:text-2xl my-5'> Quality Services</p>
          <p className='font-extralight'>
              Quality after-sales services to ensure customer satisfaction.
          </p>
        </div>
      
      
        <div>
          <img src={discountIcon} alt="discount" className='w-24 m-auto mb-5 hover:scale-110 transition ease-in-out'/>
      
          <p className='font-semibold text-base md:text-xl lg:text-2xl my-5'>Discounts & Offers</p>
          <p className='font-extralight'>
              For every first device you purchase you get a complimentary screen protector.
          </p>
        </div>
      
      </div>
    </div>
  )
}

export default OurPolicy