import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { Trash2, RefreshCcw, Heart } from 'lucide-react';
import BrandedSpinner from '../components/BrandedSpinner';
import Breadcrumbs from '../components/BreadCrumbs';
import Title from '../components/Title';
import { ShopContext } from '../context/ShopContext';
import { Square3Stack3DIcon } from '@heroicons/react/24/outline';

const Wishlist = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const { backendUrl, token, currency, addToCompare } = useContext(ShopContext);

    // Function to fetch wishlist data
    const fetchWishlist = async () => {
        setIsLoading(true);
        setIsError(false);

        try {
            const response = await axios.get(`${backendUrl}/wishlist`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setWishlistItems(response.data.wishlist);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            toast.error('Failed to load wishlist data');
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch data on component mount
    useEffect(() => {
        fetchWishlist();
    }, [backendUrl, token]);

    // function to handle open modal
    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setShowDeleteModal(true);
    };

    // Handle removing item from wishlist
    const handleRemoveFromWishlist = async () => {
        if (!itemToDelete) return;

        try {
            await axios.delete(`${backendUrl}/wishlist/${itemToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local state to reflect the change
            setWishlistItems(wishlistItems.filter(item => item.id !== itemToDelete.id));
            toast.success('Item removed from wishlist');
            setShowDeleteModal(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Error removing item from wishlist:', error);
            toast.error('Failed to remove item from wishlist');
        }
    };

    // function to handle modal close
    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setItemToDelete(null);
    };

    // Handle adding item to compare
    const handleAddToCompare = (product) => {
        // Assuming addToCompare is a function provided by ShopContext
        if (typeof addToCompare === 'function') {
            addToCompare(product.id);
            toast.success(`${product.name} added to compare`);
        }
    };

    // utility function for formatting price
    const formatPrice = (price) => {
        return price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ", ");
    };

    return (
        <>
            <Breadcrumbs />
            <div className="bg-bgdark text-primary pt-4 sm:pt-8 pb-16">
                <div className="container mx-auto sm:px-4 xl:px-0 max-w-screen-2xl">
                    {/* Page Header */}
                    <div className="mb-12 text-center text-[20px] sm:text-3xl">
                        <Title text1={'MY'} text2={'WISHLIST'} />
                        <p className="text-secondary w-3/4 m-auto text-sm sm:text-base mx-auto">
                            View and manage your favorite products
                        </p>
                    </div>

                    {/* Main Content */}
                    {isLoading ? (
                        <div className="flex justify-center items-center min-h-64 py-16">
                            <BrandedSpinner message='Loading wishlist data...' />
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col justify-center items-center min-h-64 py-16 text-center">
                            <h2 className="text-2xl mb-4">Something went wrong</h2>
                            <p className="text-gray-400 mb-6">We couldn't load your wishlist information</p>
                            <button
                                onClick={fetchWishlist}
                                className="flex items-center bg-accent text-bgdark px-6 py-3 rounded-full hover:bg-bgdark hover:text-accent hover:border border-accent transition-all"
                            >
                                <RefreshCcw size={18} className="mr-2" />
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <div className="max-w-full mx-auto">
                            {/* Wishlist Stats */}
                            <div className="bg-bgdark rounded-xl p-4 sm:p-6 border border-border hover:border-accent transition-all shadow-md hover:shadow-lg shadow-black/30 mb-8">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-medium">Saved Items</h3>
                                    <div className="p-2 bg-accent/20 rounded-full">
                                        <Heart className="w-5 h-5 text-accent" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold">{wishlistItems ? wishlistItems.length : 0}</p>
                                <p className="text-secondary text-sm mt-4">Items in your wishlist</p>
                            </div>

                            {/* Wishlist Table */}
                            <div className="bg-bgdark rounded-xl p-4 sm:p-6 border border-border transition-all shadow-md hover:shadow-lg shadow-black/30">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg sm:text-xl font-bold">Wishlist Items</h3>
                                </div>

                                <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
                                    {wishlistItems.length > 0 ? (
                                        <table className="w-[480px] sm:w-full table-auto overflow-auto">
                                            <thead className="text-left">
                                                <tr className="border-b border-border">
                                                    <th className="pb-3 text-secondary font-medium text-sm sm:text-base">Product</th>
                                                    <th className="pb-3 text-secondary font-medium text-sm sm:text-base">Brand</th>
                                                    <th className="pb-3 text-secondary font-medium text-sm sm:text-base">Category</th>
                                                    <th className="pb-3 text-secondary font-medium text-sm sm:text-base">Price</th>
                                                    <th className="pb-3 text-secondary font-medium text-sm sm:text-base">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {wishlistItems.map((item) => (
                                                    <tr key={item.id} className="border-b border-border hover:bg-border/20 transition-all">
                                                        <td className="py-4">
                                                            <Link to={`/product/${item.id}`}>
                                                                <div className="flex items-center">
                                                                    <img
                                                                        src={item.image_url}
                                                                        alt={item.name}
                                                                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md mr-3"
                                                                    />
                                                                    <p className="font-medium text-sm sm:text-base hover:text-accent transition-colors">
                                                                        {item.name}
                                                                    </p>
                                                                </div>
                                                            </Link>
                                                        </td>
                                                        <td className="py-4 text-sm sm:text-base">{item.brand}</td>
                                                        <td className="py-4 text-sm sm:text-base">{item.category}</td>
                                                        <td className="py-4 text-sm sm:text-base">{currency} {formatPrice(item.price)}</td>
                                                        <td className="py-4">
                                                            <div className="flex space-x-3">
                                                                <button
                                                                    onClick={() => handleAddToCompare(item)}
                                                                    className="p-2 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                                                                    title="Add to compare"
                                                                >
                                                                    <Square3Stack3DIcon className='h-4 w-4' />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteClick(item)}
                                                                    className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                                                                    title="Remove from wishlist"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Heart className="w-8 h-8 text-accent" />
                                            </div>
                                            <h3 className="text-lg sm:text-xl font-bold mb-2">Your wishlist is empty</h3>
                                            <p className="text-secondary mb-8">Browse our collection and add items to your wishlist</p>
                                            <Link to="/collection">
                                                <button className="bg-accent text-bgdark px-8 py-3 rounded-full hover:bg-bgdark hover:text-accent hover:border border-accent transition-all">
                                                    Discover Products
                                                </button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Delete Confirmation Modal */}
                            {showDeleteModal && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                    <div className="bg-bgdark border border-border rounded-xl p-6 max-w-md w-[90%] mx-4">
                                        <h3 className="text-xl font-bold mb-4">Remove from Wishlist</h3>
                                        <p className="text-secondary mb-6">
                                            Are you sure you want to remove "{itemToDelete?.name}" from your wishlist?
                                        </p>
                                        <div className="flex gap-4 justify-end">
                                            <button
                                                onClick={handleCancelDelete}
                                                className="px-4 py-2 rounded-full border border-border hover:border-accent text-secondary hover:text-accent transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleRemoveFromWishlist}
                                                className="px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Wishlist;