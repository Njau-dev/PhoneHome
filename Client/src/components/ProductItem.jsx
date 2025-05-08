import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';


const ProductItem = ({ id, image, name, price, category, hasVariation }) => {
    const { currency, addToCart } = useContext(ShopContext);

    const handleAddToWishlist = (e) => {
        e.preventDefault();
        toast.success('Added to wishlist');
    }

    const handleAddToCart = (id) => {
        const productId = id;
        addToCart(productId)

        toast.success('Added to cart');
    }

    return (
        <div className="group relative overflow-hidden rounded-md border border-border hover:border-accent hover:rounded-none transition-all duration-300">
            <Link to={`/product/${id}`} className="block">
                <div className="overflow-hidden">
                    <img
                        src={image[0]}
                        alt={name}
                        className="w-full h-40 lg:h-64 object-cover transition-transform duration-700"
                    />

                    {/* Price range indicator for variations */}
                    {hasVariation && (
                        <div className="absolute top-3 right-3 bg-accent text-bgdark px-2 py-1 rounded text-xs font-medium">
                            Multiple Options
                        </div>
                    )}
                </div>

                <div className="p-4 bg-bgdark">
                    <p className="text-sm text-secondary">{category}</p>
                    <p className="text-sm font-medium mt-1 truncate">{name}</p>
                    <p className="text-sm font-bold mt-1 text-accent">{currency} {price}</p>
                </div>
            </Link>

            {/* Action buttons that slide up on hover */}
            <div className="absolute bottom-0 left-0 right-0 bg-bgdark border-t border-border transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 p-3 flex justify-between items-center">
                {hasVariation ? (
                    <Link to={`/product/${id}`} className="flex-1 bg-accent text-bgdark py-2 pl-2 rounded text-center text-sm font-medium flex items-center justify-center hover:bg-bgdark hover:border hover:border-accent">
                        View<ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                ) : (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            handleAddToCart(id);
                        }}
                        className="flex-1 bg-accent text-bgdark py-2 rounded text-center text-sm font-medium flex items-center justify-center hover:bg-bgdark hover:border hover:border-accent hover:text-accent"
                    >
                        <ShoppingCart className="w-4 h-4 ml-1" />
                    </button>
                )}
                <button
                    className="ml-2 p-2 border border-border rounded hover:border-accent"
                    onClick={handleAddToWishlist}
                >
                    <Heart className="w-4 h-4 text-accent" />
                </button>
            </div>
        </div>
    );
};

export default ProductItem;