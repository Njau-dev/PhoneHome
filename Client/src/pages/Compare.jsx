import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { Eye, RefreshCcw, ShoppingCart, X } from 'lucide-react';
import BrandedSpinner from '../components/BrandedSpinner';
import Breadcrumbs from '../components/BreadCrumbs';
import Title from '../components/Title';
import { ShopContext } from '../context/ShopContext';

const Compare = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    const {
        compareItems,
        fetchCompareItems,
        removeFromCompare,
        addToCart,
        currency,
        getCompareSpecifications
    } = useContext(ShopContext);

    // Fetch data on component mount
    useEffect(() => {
        const loadCompareData = async () => {
            setIsLoading(true);
            setIsError(false);

            try {
                await fetchCompareItems();
            } catch (error) {
                console.error('Error loading compare data:', error);
                setIsError(true);
                toast.error('Failed to load comparison data');
            } finally {
                setIsLoading(false);
            }
        };

        loadCompareData();
    }, []);

    // Handle add to cart from compare page
    const handleAddToCart = (productId) => {
        addToCart(productId, null, 1);
        toast.success('Product added to cart');
    };


    // Get all specifications for comparison
    const specifications = getCompareSpecifications();

    return (
        <>
            <Breadcrumbs />
            <div className="bg-bgdark text-primary pt-4 sm:pt-8 pb-16">
                <div className="container mx-auto px-4 xl:px-0 max-w-screen-2xl">
                    {/* Page Header */}
                    <div className="mb-12 text-center text-[24px] sm:text-3xl">
                        <Title text1={'PRODUCT'} text2={'COMPARISON'} />
                        <p className="text-secondary w-3/4 m-auto text-sm sm:text-base mx-auto">
                            Compare product features side by side to make the best choice
                        </p>
                    </div>

                    {/* Main Content */}
                    {isLoading ? (
                        <div className="flex justify-center items-center min-h-64 py-16">
                            <BrandedSpinner message='Loading comparison data...' />
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col justify-center items-center min-h-64 py-16 text-center">
                            <h2 className="text-2xl mb-4">Something went wrong</h2>
                            <p className="text-gray-400 mb-6">We couldn't load your comparison information</p>
                            <button
                                onClick={fetchCompareItems}
                                className="flex items-center bg-accent text-bgdark px-6 py-3 rounded-full hover:bg-bgdark hover:text-accent hover:border border-accent transition-all"
                            >
                                <RefreshCcw size={18} className="mr-2" />
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <div className="max-w-full mx-auto">
                            {compareItems.length > 0 ? (
                                <div className="bg-bgdark rounded-md md:border md:border-border py-6 pr-6 lg:pl-6 transition-all overflow-x-auto">
                                    <div className="min-w-[768px]"> {/* Set minimum width for scrolling on small screens */}
                                        <div className="grid grid-cols-4 gap-4">
                                            {/* Column for specification labels */}
                                            <div className="col-span-1 sticky left-0 z-10 w-[130px] sm:w-full border-r border-border md:border-none">
                                                {/* Add backdrop blur wrapper that covers the entire column */}
                                                <div className="absolute inset-0 bg-bgdark" />

                                                {/* Content wrapper */}
                                                <div className="relative z-30 px-2 h-full">
                                                    <div className="h-48 md:h-64 flex items-end justify-center mb-2 sm:mb-4">
                                                        <p className="text-base md:text-lg font-bold text-accent">Specifications </p>
                                                    </div>

                                                    {specifications.map((spec, index) => (
                                                        <div key={index} className="py-3 md:py-4 border-t border-border">
                                                            <p className="text-sm font-medium text-center">{spec.name}</p>
                                                        </div>
                                                    ))}

                                                    <div className="py-3 md:py-4 border-t border-border">
                                                        {/* Empty cell to align with action buttons */}
                                                    </div>
                                                </div>
                                            </div>


                                            {/* Scrollable product columns */}
                                            <div className="col-span-3 overflow-x-auto">
                                                <div className="grid grid-cols-3 gap-4">
                                                    {/* Product columns */}
                                                    {compareItems.map((product, productIndex) => (
                                                        <div key={product.id} className="col-span-1">
                                                            {/* Product header with image and remove button */}
                                                            <div className="relative h-48 md:h-64 flex flex-col items-center justify-center mb-2 sm:mb-4">
                                                                <button
                                                                    onClick={() => removeFromCompare(product.id)}
                                                                    className="absolute top-2 right-2 p-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-full transition-all z-5"
                                                                    title="Remove from comparison"
                                                                >
                                                                    <X size={16} />
                                                                </button>

                                                                <Link to={`/product/${product.id}`}>
                                                                    <img
                                                                        src={product.image_urls[0]}
                                                                        alt={product.name}
                                                                        className="w-full h-48 md:h-64 object-cover rounded-md"
                                                                    />
                                                                </Link>
                                                            </div>

                                                            {/* Product specifications */}
                                                            {specifications.map((spec, specIndex) => {
                                                                let value = product[spec.key];

                                                                // Handle RAM, Storage and Price for products with variations
                                                                if (product.hasVariation && product.variations.length > 1) {
                                                                    if (spec.key === 'ram') {
                                                                        // Get unique RAM values from variations
                                                                        const rams = [...new Set(product.variations.map(v => v.ram))];
                                                                        value = rams.join(', ');
                                                                    } else if (spec.key === 'storage') {
                                                                        // Get unique storage values from variations
                                                                        const storages = [...new Set(product.variations.map(v => v.storage))];
                                                                        value = storages.join(', ');
                                                                    } else if (spec.key === 'price') {
                                                                        // Get price range from base price to highest variation price
                                                                        const maxPrice = Math.max(...product.variations.map(v => v.price));
                                                                        value = `${product.price} - ${maxPrice}`;
                                                                    }
                                                                } else {
                                                                    // For non-variation products, use the direct values
                                                                    value = product[spec.key];
                                                                }

                                                                // Format the display value
                                                                const displayValue = spec.format ? spec.format(value) : value || '-';

                                                                return (
                                                                    <div key={specIndex} className="py-3 md:py-4 border-t border-border">
                                                                        <p className={`text-sm ${spec.key === 'name' ? 'font-medium hover:text-accent' : ''}`}>
                                                                            {displayValue}
                                                                        </p>
                                                                    </div>
                                                                );
                                                            })}

                                                            {/* Add to cart or Select Options button */}
                                                            <div className="py-4 border-t border-border">
                                                                {product.hasVariation ? (
                                                                    <Link
                                                                        to={`/product/${product.id}`}
                                                                        className="w-full bg-accent text-bgdark py-2 px-4 rounded-lg hover:bg-bgdark hover:text-accent hover:border border-accent transition-all flex items-center justify-center gap-2"
                                                                    >
                                                                        <Eye /> Select Options
                                                                    </Link>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleAddToCart(product.id)}
                                                                        className="w-full bg-accent text-bgdark py-2 px-4 rounded-lg hover:bg-bgdark hover:text-accent hover:border border-accent transition-all flex items-center justify-center gap-2"
                                                                    >
                                                                        <ShoppingCart size={16} />
                                                                        Add to Cart
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Empty columns to fill up to 3 if needed */}
                                                    {[...Array(Math.max(0, 3 - compareItems.length))].map((_, emptyIndex) => (
                                                        <div key={`empty-${emptyIndex}`} className="col-span-1">
                                                            <div className="h-48 md:h-64 border border-dashed border-border rounded-lg flex flex-col items-center justify-center mb-2 sm:mb-4">
                                                                <p className="text-secondary text-sm mb-4">Add a product</p>
                                                                <Link to="/collection">
                                                                    <button className="bg-border text-primary px-4 py-2 rounded-lg hover:bg-accent hover:text-bgdark transition-all text-sm">
                                                                        Browse Products
                                                                    </button>
                                                                </Link>
                                                            </div>

                                                            {/* Empty cells to maintain grid alignment */}
                                                            {specifications.map((_, specIndex) => (
                                                                <div key={specIndex} className="py-3 md:py-4 border-t border-border">
                                                                    <p className="text-sm text-secondary">-</p>
                                                                </div>
                                                            ))}

                                                            <div className="py-3 md:py-4 border-t border-border">
                                                                {/* Empty cell for action button alignment */}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-bgdark rounded-xl p-6 border border-border transition-all shadow-md hover:shadow-lg shadow-black/30">
                                    <h3 className="text-xl font-bold mb-4">No products to compare</h3>
                                    <p className="text-secondary mb-8">Add products to comparison from your wishlist or product pages</p>
                                    <Link to="/collection">
                                        <button className="bg-accent text-bgdark px-8 py-3 rounded-full hover:bg-bgdark hover:text-accent hover:border border-accent transition-all">
                                            Browse Products
                                        </button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div >
            </div >
        </>
    );
};

export default Compare;