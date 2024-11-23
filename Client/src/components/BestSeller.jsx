import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title';
import ProductItem from './ProductItem';


const BestSeller = () => {

    const { products } = useContext(ShopContext);
    const [bestSeller, setBestSeller] = useState([]);

    const allProducts = [
        ...products.phones,
        ...products.tablets,
        ...products.laptops,
        ...products.audio
    ];

    useEffect(() => {
        const bestProduct = allProducts.filter((item) => (item.isBestSeller));

        setBestSeller(bestProduct.slice(0, 6));
    }, [])


    return (
        <div className='my-10'>
            <div className='text-center text-3xl py-8'>
                <Title text1={'BEST'} text2={'SELLERS'} />
                <p className='w-3/4 m-auto text-sm sm:text-base'>Take a look at the best selling devices and technology here at Phone Home Kenya</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
                {
                    bestSeller.map((product, index) => (
                        <ProductItem key={index} id={product.id} image={product.image_urls} name={product.name} price={product.price} brand={product.brand} />
                    ))
                }
            </div>

        </div>
    )
}

export default BestSeller
