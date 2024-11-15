import React, { useContext, useState } from 'react'
import Title from '../components/Title'
import CartTotal from '../components/CartTotal'
import { ShopContext } from '../context/ShopContext';

const PlaceOrder = () => {

  const [selectedMethod, setSelectedMethod] = useState('cash');

  const { navigate } = useContext(ShopContext);

  return (
    <div className='flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[70vh] border-t border-border'>

      {/* -----LEFT sIDE----- */}
      <div className='flex flex-col gap-4 w-full sm:max-w-[750px]'>

        <div className='text-xl sm:text-2xl my-3'>
          <Title text1={'DELIVERY'} text2={'INFORMATION'} />
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="First name"
            className="w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
          />
          <input
            type="text"
            placeholder="Last name"
            className="w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
          />
        </div>

        <input
          type="email"
          placeholder="Email address"
          className="w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
        />

        <input
          type="number"
          placeholder="Phone no."
          className="w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
        />

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="City / Town"
            className="w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
          />
          <input
            type="text"
            placeholder="Street address"
            className="w-full px-2 py-3.5 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
          />
        </div>


        <textarea
          placeholder="Additional Information"
          className="w-full h-32 p-3 text-primary placeholder:text-secondary bg-bgdark border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded resize-none"
        ></textarea>


      </div>

      {/* -----RIGHT SIDE---------- */}

      <div className='mt-8 border-2 border-accent p-3 rounded-lg '>
        <div className='m-4 min-w-80 lg:min-w-[420px]'>
          <CartTotal />
        </div>
        <div className='mt-12 m-4 text-xl'>
          <Title text1={'PAYMENT'} text2={'METHOD'} />

          {/* ----------Payment method selection---------- */}
          <div className='flex gap-4 flex-col'>
            {/* Cash on Delivery */}
            <div
              onClick={() => setSelectedMethod('cash')}
              className={`flex items-center gap-3 p-2 px-3 cursor-pointer ${selectedMethod === 'cash' ? 'bg-gray-800' : ''}`}
            >
              <p className={`min-w-3.5 h-3.5 border ${selectedMethod === 'cash' ? 'border-accent bg-accent' : 'border-primary'} rounded-full`}></p>
              <p className='text-base font-medium'>Cash on Delivery</p>
            </div>
            {/* Conditional Info for Cash on Delivery */}
            {selectedMethod === 'cash' && (
              <div
                className={`p-2 px-3 text-sm text-gray-300 border-l-2 bg-border border-accent transition-all duration-300`}
              >
                Pay cash on delivery: Only applies for orders within Nairobi county.
              </div>
            )}

            {/* Pay on Order */}
            <div
              onClick={() => setSelectedMethod('order')}
              className={`flex items-center gap-3 p-2 px-3 cursor-pointer ${selectedMethod === 'order' ? 'bg-gray-800' : ''}`}
            >
              <p className={`min-w-3.5 h-3.5 border ${selectedMethod === 'order' ? 'border-accent bg-accent' : 'border-primary'} rounded-full`}></p>
              <p className='text-base font-medium'>Pay on Order</p>
            </div>

            {/* Conditional Info for Pay on Order */}
            {selectedMethod === 'order' && (
              <div
                className={`p-2 px-3 text-sm text-gray-300 border-l-2 bg-border border-accent transition-all duration-300`}
              >
                Pay when you order: This applies for orders outside Nairobi county
              </div>
            )}
          </div>

          <div className='w-full text-center mt-8'>
            <button onClick={() => navigate('/orders')} className='bg-accent  hover:bg-bgdark hover:text-accent hover:border border-accent rounded text-bgdark text-base mt-8 mb-3 py-3 px-12'>PLACE ORDER</button>
          </div>
        </div>

      </div>
    </div>

  )
}

export default PlaceOrder
