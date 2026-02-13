"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, RefreshCcw } from "lucide-react";
import { useWishlist, useCompare } from "@/lib/hooks";
import BrandedSpinner from "@/components/common/BrandedSpinner";
import Title from "@/components/common/Title";
import WishlistStats from "@/components/wishlist/WishlistStats";
import WishlistItem from "@/components/wishlist/WishlistItem";
import DeleteModal from "@/components/common/DeleteModal";

export default function WishlistPage() {
    const { items, isLoading, removeFromWishlist, syncWithServer } = useWishlist();
    const { addToCompare } = useCompare();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);

    const handleDeleteClick = (item: any) => {
        setItemToDelete(item);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (itemToDelete) {
            await removeFromWishlist(itemToDelete.id);
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setItemToDelete(null);
    };

    if (isLoading) {
        return <BrandedSpinner message="Loading wishlist..." />;
    }

    return (
        <div className="pt-4 pb-16">
            <div className="container mx-auto">
                {/* Header */}
                <div className="mb-12 text-center text-2xl sm:text-3xl">
                    <Title text1="MY" text2="WISHLIST" />
                    <p className="text-secondary w-3/4 m-auto text-sm sm:text-base mx-auto">
                        View and manage your favorite products
                    </p>
                </div>

                {/* Stats */}
                <WishlistStats count={items.length} />

                {/* Wishlist Table */}
                <div className="bg-bg-card rounded-xl p-4 sm:p-6 border border-border shadow-md">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg sm:text-xl font-bold">Wishlist Items</h3>
                        <button
                            onClick={syncWithServer}
                            className="flex items-center gap-2 text-sm text-secondary hover:text-accent transition-colors"
                        >
                            <RefreshCcw size={16} />
                            Refresh
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        {items.length > 0 ? (
                            <table className="w-full min-w-160">
                                <thead className="text-left">
                                    <tr className="border-b border-border">
                                        <th className="pb-3 text-secondary font-medium text-sm sm:text-base">
                                            Product
                                        </th>
                                        <th className="pb-3 text-secondary font-medium text-sm sm:text-base">
                                            Brand
                                        </th>
                                        <th className="pb-3 text-secondary font-medium text-sm sm:text-base">
                                            Category
                                        </th>
                                        <th className="pb-3 text-secondary font-medium text-sm sm:text-base">
                                            Price
                                        </th>
                                        <th className="pb-3 text-secondary font-medium text-sm sm:text-base">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <WishlistItem
                                            key={item.id}
                                            item={item}
                                            onRemove={() => handleDeleteClick(item)}
                                            onAddToCompare={() => addToCompare(item as any)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Heart className="w-8 h-8 text-accent" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold mb-2">
                                    Your wishlist is empty
                                </h3>
                                <p className="text-secondary mb-8">
                                    Browse our collection and add items to your wishlist
                                </p>
                                <Link href="/collection">
                                    <button className="bg-accent text-bg px-8 py-3 rounded-full hover:bg-bg hover:text-accent border border-transparent hover:border-accent transition-all">
                                        Discover Products
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Delete Modal */}
                <DeleteModal
                    isOpen={showDeleteModal}
                    itemName={itemToDelete?.name || ""}
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                />
            </div>
        </div>
    );
}
