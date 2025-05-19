import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import ProductItem from './ProductItem';
import { ChevronRight } from 'lucide-react';
import Title from './Title';

const BrandSection = ({ brand, products }) => {
    const { navigate } = useContext(ShopContext);

    const allProducts = [
        ...products.phones,
        ...products.tablets,
        ...products.laptops,
        ...products.audio
    ];

    // Filter products by the current brand
    const brandProducts = allProducts.filter(product =>
        product.brand && product.brand.toLowerCase() === brand.name.toLowerCase()
    ).slice(0, 5);

    if (brandProducts.length === 0) return null;

    return (
        <div className="w-full bg-bgdark py-4 sm:py-12">
            <div className="container mx-auto sm:px-4">
                <div className='text-center text-[18px] sm:text-2xl py-5 sm:py-8'>
                    <Title text1={brand.name} text2={'Products'} />
                    <p className='w-3/4 m-auto text-xs sm:text-base text-secondary'>
                        {brand.description}
                    </p>
                </div>

                {/* Brand Banner */}
                <div
                    className="w-full h-40 sm:h-64 rounded-lg overflow-hidden relative mb-8 bg-cover bg-center"
                    style={{ backgroundImage: `url('${brand.bannerImage}')` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-bgdark/90 to-transparent ">
                        <div className="px-4 py-3 *:sm:px-8 sm:py-6 max-w-lg flex  items-end h-full">

                            <button
                                onClick={() => navigate(`/collection/Phone?brand=${brand.name}`)}
                                className="bg-accent hover:bg-bgdark hover:text-accent hover:border border-accent rounded text-bgdark px-4 py-1.5 sm:px-6 sm:py-2 flex items-center text-xs sm:text-sm font-medium transition-all duration-300"
                            >
                                Shop {brand.name} <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="flex justify-end mb-6">
                    <button
                        onClick={() => navigate(`/collection/Phone?brand=${brand.name}`)}
                        className="text-accent hover:underline flex items-center text-sm"
                    >
                        View All <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
                    {brandProducts.map((product) => (
                        <ProductItem
                            key={product.id}
                            id={product.id}
                            image={product.image_urls}
                            name={product.name}
                            price={product.price}
                            category={product.category}
                            hasVariation={product.hasVariation}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BrandSection;