import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title';
import ProductItem from './ProductItem';
import ProductCarousel from './ProductCarousel';


const BestSeller = () => {

    const { products } = useContext(ShopContext);
    const [bestSeller, setBestSeller] = useState([]);

    useEffect(() => {
        const allProducts = [
            ...(products.phones || []),
            ...(products.tablets || []),
            ...(products.laptops || []),
            ...(products.audio || [])
        ];

        const bestProduct = allProducts.filter((item) => (item.isBestSeller));

        setBestSeller(bestProduct.slice(0, 10));
    }, [products]);


    return (
        <div className='container mx-auto my-10 px-4'>
            <div className='text-center text-3xl py-8'>
                <Title text1={'BEST'} text2={'SELLERS'} />
                <p className='w-3/4 m-auto text-sm sm:text-base'>Take a look at the best selling devices and technology here at Phone Home Kenya</p>
            </div>

            {bestSeller.length > 0 ? (
                <ProductCarousel
                    slidesToShow={5}
                    className="pb-6"
                >
                    {bestSeller.map((product, index) => (
                        <div key={index} className="px-3">
                            <ProductItem
                                id={product.id}
                                image={product.image_urls}
                                name={product.name}
                                price={product.price}
                                brand={product.brand}
                                hasVariation={product.hasVariation}
                            />
                        </div>
                    ))}
                </ProductCarousel>
            ) : (
                <p className="text-center">No Best Seller Products available</p>
            )}


        </div>
    )
}

export default BestSeller
