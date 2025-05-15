import React, { useContext, useEffect } from 'react';
import { X, Package, FileText, MapPin, Clock, CreditCard } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { ShopContext } from '../context/ShopContext';

const OrderDetailsModal = ({
    order,
    onClose,
    formatPrice,
    formatDate,
    canViewInvoice,
    canViewReceipt,
    downloadDocument
}) => {
    const { delivery_fee, currency } = useContext(ShopContext)

    // Calculate the total order value
    const calculateOrderTotal = () => {
        return order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    // Get payment status based on payment method and order status
    const getPaymentStatus = () => {
        if (order.payment === "Success") return "Paid";
        if (order.payment === "failed") return "Failed";
        if (order.payment === "refunded") return "Refunded";
        if (order.paymentMethod === "COD" && order.status !== "Delivered") return "Unpaid";
        if (order.paymentMethod === "COD" && order.status === "Delivered") return "Paid";
        return "Unpaid";
    };

    // Get timeline based on status
    const getTimeline = () => {
        const statuses = [
            "Order Placed",
            "Packing",
            "Shipped",
            "Out for Delivery",
            "Delivered"
        ];

        const currentIndex = statuses.indexOf(order.status);

        return statuses.map((status, index) => ({
            status,
            completed: index <= currentIndex,
            current: index === currentIndex
        }));
    };

    // Prevent parent component scrolling when modal is open
    useEffect(() => {
        // Disable scrolling on body
        document.body.style.overflow = 'hidden';

        // Re-enable scrolling when component unmounts
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
            <div className="bg-bgdark border border-border rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-lg">
                {/* Modal Header */}
                <div className="sticky top-0 z-10 p-3 sm:p-4 border-b border-border bg-bgdark flex justify-between items-center">
                    <h3 className="text-lg sm:text-xl font-bold">Order #{order.id} Details</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-border/30 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 sm:p-6">
                    {/* Order Info */}
                    <div className="mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                        <div className="p-3 sm:p-4 bg-border/10 rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                <Clock size={16} className="text-accent" />
                                <h4 className="font-medium text-sm sm:text-base">Order Date</h4>
                            </div>
                            <p className="text-secondary text-sm sm:text-base">{formatDate(order.date).fullDate}</p>
                            <p className="text-secondary text-xs sm:text-sm">{formatDate(order.date).time}</p>
                            <p className="text-xs text-accent mt-1">{formatDate(order.date).relative}</p>
                        </div>

                        <div className="p-3 sm:p-4 bg-border/10 rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                <Package size={16} className="text-accent" />
                                <h4 className="font-medium text-sm sm:text-base">Order Status</h4>
                            </div>
                            <div className="mb-2">
                                <StatusBadge status={order.status} type="order" />
                            </div>
                            <p className="text-secondary text-xs sm:text-sm">Last updated: {formatDate(order.date).relative}</p>
                        </div>

                        <div className="p-3 sm:p-4 bg-border/10 rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                <CreditCard size={16} className="text-accent" />
                                <h4 className="font-medium text-sm sm:text-base">Payment</h4>
                            </div>
                            <div className="flex items-center gap-2 mb-1 sm:mb-2">
                                <StatusBadge status={getPaymentStatus()} type="payment" />
                                <span className="text-secondary text-xs sm:text-sm">{order.paymentMethod}</span>
                            </div>
                            <p className="text-secondary text-xs sm:text-sm">Method: {order.paymentMethod}</p>
                        </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="mb-6 sm:mb-8">
                        <h4 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Order Timeline</h4>
                        <div className="flex items-start gap-1 sm:gap-2 justify-between w-full">
                            {getTimeline().map((step, index) => (
                                <div key={index} className="flex flex-col items-center text-center">
                                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${step.current ? 'bg-accent' :
                                        step.completed ? 'bg-green-500' : 'bg-border'
                                        } flex items-center justify-center`}>
                                        {step.completed && !step.current && (
                                            <svg className="w-2 h-2 sm:w-3 sm:h-3 text-bgdark" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <p className={`text-[10px] sm:text-xs mt-1 ${step.current ? 'text-accent font-medium' :
                                        step.completed ? 'text-green-500' : 'text-secondary'
                                        }`}>
                                        {step.status}
                                    </p>
                                    {index < getTimeline().length - 1 && (
                                        <div className="hidden sm:block w-8 md:w-12 h-0.5 bg-border mt-3 mx-1 sm:mx-2"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="mb-6 sm:mb-8">
                        <div className="flex items-center gap-2 mb-2 sm:mb-3">
                            <MapPin size={16} className="text-accent" />
                            <h4 className="font-medium text-sm sm:text-base">Shipping Address</h4>
                        </div>
                        <div className="p-3 sm:p-4 bg-border/10 rounded-lg border border-border">
                            {order.address ? (
                                <>
                                    <p className="font-medium text-sm sm:text-base">{order.address.name}</p>
                                    <p className="text-secondary text-xs sm:text-sm mt-1">{order.address.street}</p>
                                    <p className="text-secondary text-xs sm:text-sm">{order.address.city}, {order.address.state} {order.address.zip}</p>
                                    <p className="text-secondary text-xs sm:text-sm">{order.address.country}</p>
                                    {order.address.phone && <p className="text-secondary text-xs sm:text-sm mt-1">Phone: {order.address.phone}</p>}
                                </>
                            ) : (
                                <>
                                    <p className="text-sm sm:text-base">Address information not available</p>
                                    <p className="text-secondary text-xs sm:text-sm mt-2">Contact customer support for address details</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Order Items - Now with horizontal scrolling on small screens */}
                    <div className="mb-6 sm:mb-8">
                        <h4 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Order Items</h4>
                        <div className="border border-border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-[400px] sm:min-w-full">
                                    <thead>
                                        <tr className="bg-border/20 text-xs sm:text-sm text-secondary">
                                            <th className="text-left p-3 font-medium w-full md:w-auto">Product</th>
                                            <th className="text-center p-3 font-medium whitespace-nowrap">Price</th>
                                            <th className="text-center p-3 font-medium whitespace-nowrap">Quantity</th>
                                            <th className="text-right p-3 font-medium whitespace-nowrap">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.items.map((item, index) => (
                                            <tr
                                                key={index}
                                                className={`${index !== order.items.length - 1 ? 'border-b border-border border-dashed' : ''}`}
                                            >
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <img
                                                            src={item.image_url}
                                                            alt={item.name}
                                                            className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded border border-border"
                                                        />
                                                        <div>
                                                            <h5 className="font-medium text-xs sm:text-sm">{item.name}</h5>
                                                            {item.variation_name && (
                                                                <p className="text-secondary text-[10px] sm:text-xs">Variation: {item.variation_name}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-center p-3 text-xs sm:text-sm whitespace-nowrap">{currency} {formatPrice(item.price)}</td>
                                                <td className="text-center p-3 text-xs sm:text-sm whitespace-nowrap">{item.quantity}</td>
                                                <td className="text-right p-3 text-xs sm:text-sm font-medium whitespace-nowrap">{currency} {formatPrice(item.price * item.quantity)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-3 sm:p-4 bg-border/10 border-t border-border">
                                <div className="flex justify-between mb-1 sm:mb-2 text-xs sm:text-sm">
                                    <span className="text-secondary">Subtotal:</span>
                                    <span>{currency} {formatPrice(calculateOrderTotal())}</span>
                                </div>
                                <div className="flex justify-between mb-1 sm:mb-2 text-xs sm:text-sm">
                                    <span className="text-secondary">Shipping:</span>
                                    <span>{currency} {formatPrice(delivery_fee)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-border mt-2 text-xs sm:text-sm">
                                    <span className="font-medium">Total:</span>
                                    <span className="font-bold text-accent">{currency} {formatPrice(calculateOrderTotal() + delivery_fee)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 sm:gap-3 justify-end mt-4 sm:mt-6">
                        {canViewInvoice && (
                            <button
                                onClick={() => downloadDocument(order.id, 'invoice')}
                                className="flex items-center border border-blue-500 bg-bgdark text-blue-400 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md hover:bg-blue-500 hover:text-bgdark transition-all"
                            >
                                <FileText size={14} className="mr-1 sm:mr-2" />
                                Download Invoice
                            </button>
                        )}

                        {canViewReceipt && (
                            <button
                                onClick={() => downloadDocument(order.id, 'receipt')}
                                className="flex items-center border border-green-500 bg-bgdark text-green-400 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md hover:bg-green-500 hover:text-bgdark transition-all"
                            >
                                <FileText size={14} className="mr-1 sm:mr-2" />
                                Download Receipt
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className="border border-border bg-bgdark text-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md hover:bg-border/20 transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsModal;