import React, { useState } from 'react';
import { Star, MessageCircle, FileText } from 'lucide-react';
import Title from './Title';

const ProductTabs = ({ productData }) => {
    const [activeTab, setActiveTab] = useState('description');

    // Format date for display
    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="mt-12 mb-20">
            <div className="text-[24px] md:text-2xl text-center">

                <Title text1={'PRODUCT'} text2={'INFORMATION'} />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
                <button
                    onClick={() => setActiveTab('description')}
                    className={`flex items-center px-6 py-4 text-sm font-medium relative ${activeTab === 'description'
                        ? 'text-primary'
                        : 'text-secondary hover:text-secondary'
                        }`}
                >
                    <FileText className="w-4 h-4 mr-2" />
                    Description
                    {activeTab === 'description' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent"></span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('reviews')}
                    className={`flex items-center px-6 py-4 text-sm font-medium relative ${activeTab === 'reviews'
                        ? 'text-primary'
                        : 'text-secondary hover:text-secondary'
                        }`}
                >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Reviews
                    <span className="ml-1 bg-accent/10 text-accent px-2 py-0.5 text-xs rounded-full">
                        {productData.review_count || 0}
                    </span>
                    {activeTab === 'reviews' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent"></span>
                    )}
                </button>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {/* Description Tab */}
                {activeTab === 'description' && (
                    <div className="bg-bgdark rounded-md p-6 shadow-lg border border-border">
                        <div className="prose max-w-none text-secondary">
                            <p className="mb-6 text-sm sm:text-base">{productData.description}</p>

                            {/* Specifications */}
                            <div className="mt-8">
                                <h3 className="sm:text-lg font-semibold text-accent mb-4">Technical Specifications</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm sm:text-base">
                                    {
                                        productData.type === 'phone' || productData.type === 'tablet' ? (
                                            <>
                                                {productData.ram && (
                                                    <div className="flex items-start">
                                                        <span className="text-primary font-medium w-32">RAM:</span>
                                                        <span className="text-secondary">{productData.ram}</span>
                                                    </div>
                                                )}
                                                {productData.storage && (
                                                    <div className="flex items-start">
                                                        <span className="text-primary font-medium w-32">Storage:</span>
                                                        <span className="text-secondary">{productData.storage}</span>
                                                    </div>
                                                )}
                                                {productData.processor && (
                                                    <div className="flex items-start">
                                                        <span className="text-primary font-medium w-32">Processor:</span>
                                                        <span className="text-secondary">{productData.processor}</span>
                                                    </div>
                                                )}
                                                {productData.main_camera && (
                                                    <div className="flex items-start">
                                                        <span className="text-primary font-medium w-32">Main Camera:</span>
                                                        <span className="text-secondary">{productData.main_camera}</span>
                                                    </div>
                                                )}
                                                {productData.front_camera && (
                                                    <div className="flex items-start">
                                                        <span className="text-primary font-medium w-32">Front Camera:</span>
                                                        <span className="text-secondary">{productData.front_camera}</span>
                                                    </div>
                                                )}
                                                {productData.display && (
                                                    <div className="flex items-start">
                                                        <span className="text-primary font-medium w-32">Display:</span>
                                                        <span className="text-secondary">{productData.display}</span>
                                                    </div>
                                                )}
                                                {productData.os && (
                                                    <div className="flex items-start">
                                                        <span className="text-primary font-medium w-32">OS:</span>
                                                        <span className="text-secondary">{productData.os}</span>
                                                    </div>
                                                )}
                                                {productData.connectivity && (
                                                    <div className="flex items-start">
                                                        <span className="text-primary font-medium w-32">Connectivity:</span>
                                                        <span className="text-secondary">{productData.connectivity}</span>
                                                    </div>
                                                )}
                                                {productData.colors && (
                                                    <div className="flex items-start">
                                                        <span className="text-primary font-medium w-32">Colors:</span>
                                                        <span className="text-secondary">{productData.colors}</span>
                                                    </div>
                                                )}
                                                {productData.battery && (
                                                    <div className="flex items-start">
                                                        <span className="text-primary font-medium w-32">Battery:</span>
                                                        <span className="text-secondary">{productData.battery}</span>
                                                    </div>
                                                )}
                                            </>
                                        ) : productData.type === 'audio' ? (
                                            productData.battery && (
                                                <div className="flex items-start">
                                                    <span className="text-primary font-medium w-32">Battery:</span>
                                                    <span className="text-secondary">{productData.battery}</span>
                                                </div>
                                            )
                                        ) : productData.type === 'laptop' ? (
                                            <>
                                                {productData.ram && (
                                                    <div className="flex items-start">
                                                        <span className="text-primary font-medium w-32">RAM:</span>
                                                        <span className="text-secondary">{productData.ram}</span>
                                                    </div>
                                                )}
                                                {productData.storage && (
                                                    <div className="flex items-start">
                                                        <span className="text-primary font-medium w-32">Storage:</span>
                                                        <span className="text-secondary">{productData.storage}</span>
                                                    </div>
                                                )}
                                                {productData.display && (
                                                    <div className="flex items-start">
                                                        <span className="text-primary font-medium w-32">Display:</span>
                                                        <span className="text-secondary">{productData.display}</span>
                                                    </div>
                                                )}
                                                {productData.processor && (
                                                    <div className="flex items-start">
                                                        <span className="text-primary font-medium w-32">Processor:</span>
                                                        <span className="text-secondary">{productData.processor}</span>
                                                    </div>
                                                )}
                                                {productData.os && (
                                                    <div className="flex items-start">
                                                        <span className="text-primary font-medium w-32">OS:</span>
                                                        <span className="text-secondary">{productData.os}</span>
                                                    </div>
                                                )}
                                                {productData.battery && (
                                                    <div className="flex items-start">
                                                        <span className="text-primary font-medium w-32">Battery:</span>
                                                        <span className="text-secondary">{productData.battery}</span>
                                                    </div>
                                                )}
                                            </>
                                        ) : null
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                    <div className="bg-bgdark rounded-md p-6 shadow-lg border border-border">
                        {/* Review Summary */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-border">
                            <div className="flex items-center mb-4 md:mb-0">
                                <div className="flex flex-col items-center mr-8 bg-bgdark px-6 py-4 rounded-lg">
                                    <span className="text-2xl sm:text-3xl font-bold mb-1">{productData.rating?.toFixed(1) || "0.0"}</span>
                                    <div className="flex mb-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className="w-4 h-4"
                                                fill={star <= Math.round(productData.rating || 0) ? 'var(--accents, #d5a00d)' : 'none'}
                                                stroke="var(--accents, #d5a00d)"
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs text-secondary">
                                        {productData.review_count || 0} {productData.review_count === 1 ? 'review' : 'reviews'}
                                    </span>
                                </div>

                                {/* Rating Distribution - Optional feature */}
                                {productData.review_count > 0 && (
                                    <div className="flex-1 flex flex-col space-y-1">
                                        {[5, 4, 3, 2, 1].map((rating) => (
                                            <div key={rating} className="flex items-center text-xs sm:text-sm">
                                                <span className="w-3 text-secondary">{rating}</span>
                                                <Star className="w-3 h-3 text-accent ml-1 mr-2" fill="#d5a00d" />
                                                <div className="flex-1 h-2 bg-bgdark rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-accent"
                                                        style={{
                                                            width: `${productData.review_count ?
                                                                ((productData.reviews?.filter(r => r.rating === rating).length || 0) /
                                                                    productData.review_count) * 100 : 0}%`
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* No Reviews Message */}
                        {(!productData.reviews || productData.reviews.length === 0) && (
                            <div className="text-center py-12 bg-bgdark rounded-lg">
                                <MessageCircle className="w-12 h-12 mx-auto text-secondary mb-3" />
                                <h3 className="sm:text-lg font-semibold mb-2">No reviews yet</h3>
                            </div>
                        )}

                        {/* Review Cards */}
                        {productData.reviews && productData.reviews.length > 0 && (
                            <div className="space-y-6">
                                {productData.reviews.map((review) => (
                                    <div key={review.id} className="bg-bgdark/50 rounded-lg p-3 sm:p-5 transition-all hover:shadow-md">
                                        <div className="flex justify-between items-start mb-3 text-xs sm:text-base">
                                            <div className="flex items-center">
                                                <div className="bg-accent text-primary rounded-full w-10 h-10 flex items-center justify-center font-bold mr-3">
                                                    {review.user_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-medium">{review.user_name}</h4>
                                                    <p className="text-xs text-secondary">{
                                                        review.created_at ? formatDate(review.created_at) : 'N/A'
                                                    }</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center bg-bgdark px-3 py-1 rounded-full border border-border">
                                                <span className="font-medium text-sm mr-1">{review.rating}</span>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className="w-3 h-3"
                                                        fill={star <= review.rating ? 'var(--accents, #d5a00d)' : 'none'}
                                                        stroke="var(--accents, #d5a00d)"
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {review.comment && (
                                            <div className="mt-3">
                                                <p className="text-secondary">{review.comment}</p>
                                            </div>
                                        )}

                                        {/* Optional features - Include verified purchase badge or helpful buttons */}
                                        <div className="flex items-center mt-4 pt-3 border-t border-border/50">
                                            <div className="bg-green-50 text-green-600 text-xs px-2 py-1 rounded-full border border-border mr-4">
                                                Verified Purchase
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductTabs;