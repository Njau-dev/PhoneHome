import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import ProductItem from './ProductItem';
import Title from './Title';
import ProductCarousel from './ProductCarousel';

const RelatedProducts = ({ category, brand }) => {

    const { products } = useContext(ShopContext);
    const [related, setRelated] = useState([]);

    useEffect(() => {

        if (products) {

            let allProducts = [
                ...products.phones,
                ...products.tablets,
                ...products.laptops,
                ...products.audio
            ];

            // Filter by category and brand
            let relatedProducts = allProducts.filter((item) => item.category === category && item.brand === brand);

            setRelated(relatedProducts.slice(0, 5));
        }
    }, [products, category, brand])
    return (
        <div className='my-24'>
            <div className='text-center text-3xl py-2'>
                <Title text1={'RELATED'} text2={'PRODUCTS'} />
            </div>

            {
                related.length > 0 ? (
                    <ProductCarousel
                        slidesToShow={5}
                        className="pb-6"
                    >
                        {related.map((product, index) => (
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
                    <p className='text-center'>No related products found.</p>
                )
            }
        </div>
    )
}

export default RelatedProducts
