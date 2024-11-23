import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import ProductItem from './ProductItem';
import Title from './Title';

const RelatedProducts = ({ category, brand }) => {

    const { products } = useContext(ShopContext);
    const [related, setRelated] = useState([]);

    // console.log(products);

    useEffect(() => {

        if (products) {

            let allProducts = [
                ...products.phones,
                ...products.tablets,
                ...products.laptops,
                ...products.audio
            ];

            // console.log('All Products:', allProducts);

            // Filter by category and brand
            let relatedProducts = allProducts.filter((item) => item.category === category && item.brand === brand);

            // ,  this code is to be added above after populating site with products

            // Log and set the related products (max 5)
            setRelated(relatedProducts.slice(0, 5));

            // console.log('Filtered related products:', relatedProducts);
        }
    }, [products, category, brand])
    return (
        <div className='my-24'>
            <div className='text-center text-3xl py-2'>
                <Title text1={'RELATED'} text2={'PRODUCTS'} />
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
                {
                    related.length > 0 ? (
                        related.map((product, index) => (
                            <ProductItem key={index} id={product.id} image={product.image_urls} name={product.name} price={product.price} category={product.category} />

                        ))
                    ) : (
                        <p>No related products found.</p>
                    )
                }
            </div>
        </div>
    )
}

export default RelatedProducts
