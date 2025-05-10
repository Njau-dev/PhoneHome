import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import { InboxIcon } from '@heroicons/react/24/outline';

const Orders = ({ token }) => {

    const [orders, setOrders] = useState([])

    const fetchAllOrders = async () => {

        if (!token) {
            return null;
        }

        try {

            const response = await axios.get(backendUrl + '/orders/admin',
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            )
            console.log(response.data.orders);

            if (response.data.orders) {
                setOrders(response.data.orders.reverse())
            } else {
                toast.error('Error occured while fetching orders')
            }


        } catch (error) {
            toast.error(error)
        }
    }

    const statusHandler = async (event, orderId) => {
        const newStatus = event.target.value;

        try {
            const response = await axios.put(
                `${backendUrl}/orders/status/${orderId}`,
                { status: newStatus },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 200) {
                await fetchAllOrders()
            }

            toast.success(response.data.Message);
        } catch (error) {
            console.error("Error updating order status:", error.response?.data || error.message);
            toast.error("Error updating order status:", error.response?.data || error.message)
        }
    };


    useEffect(() => {
        fetchAllOrders()
    }, [token])


    return (
        <div>
            <h3>Order Page</h3>

            <div>
                {
                    orders.map((order, index) => (
                        <div className='grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 border-border p-5 md:p-8 my-3 md:my-4 text-xs sm:text-sm ' key={index}>
                            <InboxIcon className='size-7 lg:size-9 text-accent' />

                            <div>
                                <div>
                                    {
                                        order.items.map((item, index) => {
                                            if (index === order.items.length - 1) {
                                                return <p className='py-0.5' key={index}>{item.name} x {item.quantity} <span className='text-gray-400'>{item.variation_name ? item.variation_name : ''}</span></p>
                                            } else {
                                                return <p className='py-0.5' key={index}>{item.name} x {item.quantity} <span className='text-gray-400'>{item.variation_name ? item.variation_name : ''}</span> ,</p>
                                            }
                                        })
                                    }
                                </div>
                                <p className='mt-3 mb-2 font-medium'>{order.address.firstName + " " + order.address.lastName}</p>
                                <div>
                                    <p>{order.address.email + ","}</p>
                                    <p>{order.address.city + ","}</p>
                                    <p>{order.address.street + ", " + order.address.additional_info}</p>
                                </div>
                                <p className='mt-2'>{order.address.phone + ""}</p>
                            </div>

                            <div>
                                <p className='text-sm sm:text-[15px]'>Items: {order.items.length}</p>
                                <p className='mt-3'>Method: {order.payment_method}</p>
                                <p>Payment: {order.payment ? 'Done' : 'Pending'}</p>
                                <p>Date: {new Date(order.date * 1000).toDateString()}
                                </p>
                            </div>

                            <p className='text-sm sm:text-[15px]'>{currency} {order.total_amount}</p>

                            <select value={order.status}
                                onChange={(event) => statusHandler(event, order.order_id)}
                                className='p-2 font-semibold'>
                                <option value="Order Placed">Order Placed</option>
                                <option value="Packing">Packing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Out for Delivery">Out for Delivery</option>
                                <option value="Delivered">Delivered</option>
                            </select>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default Orders
