import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from './Title';
import ProductItem from './ProductItem';
import ProductCarousel from './ProductCarousel';

const LatestCollection = () => {

    const { products } = useContext(ShopContext);
    const [latestProducts, setLatestProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
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
        <div className='container mx-auto my-3 sm:my-10 sm:px-4'>
            <div className="text-center py-6 sm:py-8 text-[20px] sm:text-3xl">
                <Title text1={'LATEST'} text2={'ARRIVALS'} />
                <p className='w-3/4 m-auto text-xs sm:text-base text-secondary'>Take a look at the most recent devices and technology here at Phone Home Kenya</p>
            </div>

            {/* Rendering the products in carousel */}
            {latestProducts.length > 0 ? (
                <ProductCarousel
                    slidesToShow={5}
                    className=" pb-6"
                >
                    {latestProducts.map((product, index) => (
                        <div key={index} className="px-1.5 sm:px-3">
                            <ProductItem
                                id={product.id}
                                image={product.image_urls}
                                name={product.name}
                                price={product.price}
                                category={product.category}
                                hasVariation={product.hasVariation}
                                review_count={product.review_count}
                                rating={product.rating}
                            />
                        </div>
                    ))}
                </ProductCarousel>
            ) : (
                <p className="text-center">No Latest Products available</p>
            )}

        </div>
    )
}
export default LatestCollection