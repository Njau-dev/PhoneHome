import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import BrandMarquee from './BrandMarquee';
import BrandSection from './BrandSection';
import Title from './Title';
import { FaApple } from 'react-icons/fa6';
import { SiSamsung } from 'react-icons/si';

const ShopByBrandsContainer = () => {
    const { products } = useContext(ShopContext);

    // Featured brands with their details
    const featuredBrands = [
        {
            name: 'Samsong',
            bannerImage: 'src/assets/images/Samsung-banner-1-scaled.jpg',
            tagline: 'Innovation for Everyone',
            description: "Discover Samsung's latest electronics with cutting - edge technology and sleek design."
        },
        {
            name: 'Apple',
            bannerImage: 'src/assets/images/iphone-16-banner.webp',
            tagline: 'Think Different',
            description: 'Experience the premium quality and seamless ecosystem of Apple products.'
        },
        {
            name: 'Xiaomi',
            bannerImage: 'src/assets/images/brands/xiaomi-banner.jpg',
            tagline: 'Innovation for Everyone',
            description: "High-quality tech at affordable prices with Xiaomi's innovative product lineup."
        }
    ];

    return (
        <div className="w-full bg-bgdark">
            <div className="container mx-auto px-4 py-12">
                <div className="text-center mb-10">
                    <div className="text-[27px] md:text-3xl">
                        <Title text1={'EXPLORE'} text2={'TOP BRANDS'} />
                    </div>
                    <p className="text-primary/80 mt-4 max-w-2xl mx-auto">
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