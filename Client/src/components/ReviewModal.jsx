import React, { useState } from 'react';
import { X, Star, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const ReviewModal = ({
    productId,
    productName,
    productImage,
    onClose,
    backendUrl,
    token
}) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoveredStar, setHoveredStar] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Submit the review
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate the input
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        if (comment.trim() === '') {
            setError('Please add a comment');
            return;
        }

        setError('');
        setIsSubmitting(true);

        try {
            await axios.post(
                `${backendUrl}/reviews/${productId}`,
                { rating, comment },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccess(true);

            // Close the modal after 2 seconds
            setTimeout(() => {
                onClose(true, { comment, rating }); // Pass true to indicate successful submission
            }, 2000);

        } catch (error) {
            const errorMessage = error.response?.data?.Error ||
                'Failed to submit review. Please try again.';
            setError(errorMessage);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
            <div className="bg-bgdark border border-border rounded-xl w-full max-w-md overflow-hidden shadow-lg">
                {/* Modal Header */}
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h3 className="text-lg font-bold">Review Product</h3>
                    <button
                        onClick={() => onClose(false)}
                        className="p-1 hover:bg-border/30 rounded-full transition-colors"
                        disabled={isSubmitting}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-6">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                            <h4 className="text-xl font-bold mb-2">Thank You!</h4>
                            <p className="text-center text-secondary">
                                Your review has been submitted successfully.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Product Info */}
                            <div className="flex items-center gap-4 mb-6">
                                <img
                                    src={productImage}
                                    alt={productName}
                                    className="w-16 h-16 object-cover rounded border border-border"
                                />
                                <div>
                                    <h4 className="font-medium">{productName}</h4>
                                    <p className="text-secondary text-sm">Share your experience with this product</p>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                                    <AlertCircle size={16} className="text-red-400" />
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            {/* Review Form */}
                            <form onSubmit={handleSubmit}>
                                {/* Rating Stars */}
                                <div className="mb-6">
                                    <label className="block text-secondary mb-2">Rating</label>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoveredStar(star)}
                                                onMouseLeave={() => setHoveredStar(0)}
                                                className="text-2xl focus:outline-none"
                                            >
                                                <Star
                                                    size={28}
                                                    className={`${star <= (hoveredStar || rating)
                                                        ? 'text-amber-400 fill-amber-400'
                                                        : 'text-border'
                                                        } transition-colors`}
                                                />
                                            </button>
                                        ))}
                                        <span className="ml-2 text-secondary">
                                            {rating > 0 ? `${rating}/5` : ''}
                                        </span>
                                    </div>
                                </div>

                                {/* Review Text */}
                                <div className="mb-6">
                                    <label htmlFor="comment" className="block text-secondary mb-2">
                                        Your Review
                                    </label>
                                    <textarea
                                        id="comment"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="w-full bg-bgdark border border-border rounded-lg p-3 focus:border-accent focus:outline-none transition-colors resize-none"
                                        placeholder="Share your experience with this product..."
                                        rows={4}
                                        disabled={isSubmitting}
                                    ></textarea>
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => onClose(false)}
                                        className="px-4 py-2 border border-border rounded-md hover:bg-border/20 transition-colors"
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className={`px-4 py-2 bg-accent text-bgdark rounded-md hover:bg-accent/90 transition-colors flex items-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                                            }`}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-bgdark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Submitting...
                                            </>
                                        ) : (
                                            'Submit Review'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;