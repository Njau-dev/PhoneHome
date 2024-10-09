import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title';
import ProductItem from './ProductItem';

const LatestCollection = () => {

    const { products } = useContext(ShopContext);
    const [latestProducts, setLatestProducts] = useState([]);

    // console.log(products);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Log products to see the structure and content
                console.log('products.phones:', products.phones);

                // Check if products.phones exists and is an array
                if (products.phones && Array.isArray(products.phones)) {
                    setLatestProducts(products.phones.slice(0, 10));
                } else {
                    console.warn('products.phones is not available or not an array.');
                }
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };

        fetchProducts();
    }, [products]);


    return (
        <div className='my-10'>
            <div className="text-center py-8 text-3xl">
                <Title text1={'LATEST'} text2={'ARRIVALS'} />
                <p className='w-3/4 m-auto text-sm sm:text-base'>Take a look at the most recent devices and technology here at Phone Home Kenya</p>
            </div>

            {/* Rendering the products */}
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
                {
                    latestProducts.length > 0 ? (
                        latestProducts.map((product, index) => (
                            <ProductItem key={index} id={product.id} image={product.image_urls} name={product.name} price={product.price} brand={product.brand} />

                        ))
                    ) : (
                        <p>No Products available</p>
                    )

                }
            </div>

        </div>
    )
}

export default LatestCollection
