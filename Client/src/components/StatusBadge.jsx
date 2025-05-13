import React from 'react';

// Status badge component for both order and payment status
const StatusBadge = ({ status, type = 'order' }) => {
    // Configuration for different status types
    const statusConfig = {
        // Order status configurations
        order: {
            pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400' },
            processing: { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
            shipped: { bg: 'bg-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-400' },
            delivered: { bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-500' },
            cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
            // Default for any other status
            default: { bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-400' }
        },
        // Payment status configurations
        payment: {
            paid: { bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-500' },
            unpaid: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400' },
            failed: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
            refunded: { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
            // Default for any other status
            default: { bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-400' }
        }
    };

    // Convert status to lowercase for consistent matching
    const normalizedStatus = status.toLowerCase();

    // Get configuration based on status type and value, fallback to default if not found
    const config = statusConfig[type][normalizedStatus] || statusConfig[type].default;

    return (
        <div className={`inline-flex items-center px-3 py-1 rounded-full ${config.bg}`}>
            <div className={`w-2 h-2 rounded-full ${config.dot} mr-2`}></div>
            <span className={`text-xs font-medium ${config.text}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        </div>
    );
};

export default StatusBadge;