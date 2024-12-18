import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title';
import axios from 'axios';

const Orders = () => {

  const { backendUrl, token, currency } = useContext(ShopContext);

  const [orderData, setOrderData] = useState([])

  const loadOrderData = async () => {

    try {
      if (!token) {
        return null
      }

      const response = await axios.get(backendUrl + '/orders',
        {
          headers: { Authorization: `Bearer ${token}` }
        })


      console.log(response.data.orders);

      if (response.data.orders) {

        let allOrderItems = []
        response.data.orders.map((order) => {
          order.items.map((item) => {
            item['status'] = order.status
            item['payment'] = order.payment
            item['paymentMethod'] = order.payment_method
            item['date'] = order.date
            allOrderItems.push(item)
          })
        })

        console.log(allOrderItems);
        // setOrderData(allOrderItems.reverse())

      }

    } catch (error) {

    }
  }

  useEffect(() => {
    loadOrderData()
  }, [token])


  return (
    <div className='border-t border-border pt-8 sm:pt-14'>
      <div className='text-2xl'>
        <Title text1={'MY'} text2={'ORDERS'} />
      </div>

      <div>
        {
          orderData.map((item, index) => (
            <div key={index} className='py-4 border-t border-b border-border text-primary flex flex-col md:flex-row md:items-center md:justify-between gap-4'>

              <div className='flex items-start gap-6 text-sm'>
                <img className='w-16 rounded-md sm:w-20' src={item.image_urls[0]} />
                <div>
                  <p className='sm:text-base font-medium'>{item.name}</p>
                  <div className='flex items-center gap-3 mt-1 text-base text-primary'>
                    <p className='text-lg'>{currency}{item.price}</p>
                    <p>Quantity: {item.quantity}</p>
                    <p>Variation: {item.variation_name}</p>
                  </div>
                  <p className='mt-1'>Date: <span className='text-secondary'> {new Date(item.date).toDateString()}</span></p>
                  <p className='mt-1'>Payment: <span className='text-secondary'> {item.paymentMethod}</span></p>
                </div>

              </div>

              <div className='md:w-1/2 flex justify-between'>
                <div className="flex items-center gap-2">
                  <p className='min-w-2 min-h-2 rounded-full bg-green-500'> </p>
                  <p className='text-sm md:text-base'>{item.status}</p>
                </div>
                <button onClick={loadOrderData} className='border border-border px-4 py-2 text-sm font-medium rounded-md'>Track order</button>

              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default Orders
