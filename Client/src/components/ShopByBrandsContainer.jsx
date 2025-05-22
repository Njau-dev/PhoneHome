import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import BrandMarquee from './BrandMarquee';
import BrandSection from './BrandSection';
import Title from './Title';

const ShopByBrandsContainer = () => {
    const { products } = useContext(ShopContext);

    // Featured brands with their details
    const featuredBrands = [
        {
            name: 'Samsung',
            bannerImage: '/assets/images/Samsung-banner-1-scaled.jpg',
            tagline: 'Innovation for Everyone',
            description: "Discover Samsung's latest electronics with cutting - edge technology and sleek design."
        },
        {
            name: 'Apple',
            bannerImage: '/assets/images/iphone-16-banner.webp',
            tagline: 'Think Different',
            description: 'Experience the premium quality and seamless ecosystem of Apple products.'
        },
        {
            name: 'Xiaomi',
            bannerImage: '/assets/images/brands/xiaomi-banner.jpg',
            tagline: 'Innovation for Everyone',
            description: "High-quality tech at affordable prices with Xiaomi's innovative product lineup."
        }
    ];

    return (
        <div className="w-full bg-bgdark">
            <div className="container mx-auto sm:px-4 py-6 sm:py-12">
                <div className='text-center text-[20px] sm:text-3xl py-6 sm:py-8'>
                    <Title text1={'EXPLORE'} text2={'TOP BRANDS'} />
                    <p className='w-3/4 m-auto text-xs sm:text-base text-secondary'>
                        Browse through our collection of premium electronic brands offering the latest technology and innovation
                    </p>
                </div>

                {/* Marquee with brand logos */}
                <BrandMarquee />
            </div>



            {/* Individual brand sections */}
            {featuredBrands.map((brand) => (
                <BrandSection
                    key={brand.name}
                    brand={brand}
                    products={products || []}
                />
            ))}
        </div>
    );
};

export default ShopByBrandsContainer;