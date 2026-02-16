import React from 'react';

// Status badge component for both order and payment status
const StatusBadge = ({ status, type = 'order' }) => {
    // Configuration for different status types
    const statusConfig = {
        // Order status configurations
        order: {
            // Handle your specific order statuses
            'pending payment': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400' },
            'payment failed': { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
            'order placed': { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
            'packing': { bg: 'bg-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-400' },
            'shipped': { bg: 'bg-indigo-500/20', text: 'text-indigo-400', dot: 'bg-indigo-400' },
            'out for delivery': { bg: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-400' },
            'delivered': { bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-500' },

            // Legacy statuses for backward compatibility
            'pending': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400' },
            'processing': { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
            'cancelled': { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
            'failed': { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },

            // Default for any other status
            default: { bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-400' }
        },
        // Payment status configurations
        payment: {
            'paid': { bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-500' },
            'unpaid': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400' },
            'failed': { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
            'refunded': { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
            'processing': { bg: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-400' },

            // Default for any other status
            default: { bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-400' }
        }
    };

    // Normalize status for consistent matching
    // Convert to lowercase and trim whitespace
    const normalizedStatus = status?.toString().toLowerCase().trim();

    // Get configuration based on status type and value, fallback to default if not found
    const config = statusConfig[type][normalizedStatus] || statusConfig[type].default;

    // Format display text - keep original casing but clean up
    const displayText = status?.toString().trim() || 'Unknown';

    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></div>
            {displayText}
        </div>
    );
};

export default StatusBadge