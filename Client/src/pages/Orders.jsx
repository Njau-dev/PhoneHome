import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title';

const Orders = () => {

  const { products, currency } = useContext(ShopContext);


  const flatProducts = [
    ...products.phones,
    ...products.tablets,
    ...products.laptops,
    ...products.audio
  ];

  return (
    <div className='border-t border-border pt-8 sm:pt-14'>
      <div className='text-2xl'>
        <Title text1={'MY'} text2={'ORDERS'} />
      </div>

      <div>
        {
          flatProducts.slice(2, 6).map((item, index) => (
            <div key={index} className='py-4 border-t border-b border-border text-primary flex flex-col md:flex-row md:items-center md:justify-between gap-4'>

              <div className='flex items-start gap-6 text-sm'>
                <img className='w-16 rounded-md sm:w-20' src={item.image_urls[0]} />
                <div>
                  <p className='sm:text-base font-medium'>{item.name}</p>
                  <div className='flex items-center gap-3 mt-2 text-base text-primary'>
                    <p className='text-lg'>{currency}{item.price}</p>
                    <p>Quantity: 1</p>
                    <p>Variation: 8GB-256GB</p>
                  </div>
                  <p className='mt-2'>Date: <span className='text-secondary'> 25 July 2025</span></p>
                </div>

              </div>

              <div className='md:w-1/2 flex justify-between'>
                <div className="flex items-center gap-2">
                  <p className='min-w-2 min-h-2 rounded-full bg-green-500'> </p>
                  <p className='text-sm md:text-base'>Ready to ship</p>
                </div>
                <button className='border border-border px-4 py-2 text-sm font-medium rounded-md'>Track order</button>

              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default Orders
