import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';

const List = ({ token }) => {

    const [list, setList] = useState([]);

    const fetchList = async () => {
        try {
            const response = await axios.get(backendUrl + '/products')
            if (response.data.products) {
                setList(response.data.products);

            } else {
                response.data.message
            }

        } catch (error) {
            console.error(error);
            toast.error(error.message)
        }
    }

    const removeProduct = async (id) => {
        try {

            const response = await axios.delete(backendUrl + '/product/' + id, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            if (response.status === 200) {
                toast.success('Product deleted successfully!');
                await fetchList();
            } else {
                toast.error(response.data)
            }

        } catch (error) {


        }
    }

    useEffect(() => {
        fetchList()
    }, [])

    return (
        <>
            <p className='mb-2'>All Products List</p>

            <div className='flex flex-col gap-2'>

                {/* -----List Table Title -------*/}

                <div className='hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center py-1 px-2 border border-border text-sm bg-border'>
                    <b>Image</b>
                    <b>Name</b>
                    <b>Category</b>
                    <b>Price</b>
                    <b className='text-center'>Action</b>
                </div>

                {/* -----product list -----*/}
                {
                    list.map((item, index) => (
                        <div key={index}
                            className='grid grid-cols-[1fr_3fr_1fr] md:grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center gap-2 py-1 px-2 border border-border text-sm'
                        >
                            <img className='w-12' src={item.image_urls[0]} alt="" />
                            <p>{item.name}</p>
                            <p>{item.category}</p>
                            <p>{currency} {item.price}</p>
                            <p onClick={() => removeProduct(item.id)} className='text-right md:text-center cursor-pointer text-lg'>X</p>
                        </div>
                    ))
                }
            </div>
        </>
    )
}

export default List
