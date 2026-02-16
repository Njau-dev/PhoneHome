import React, { useContext, useEffect, useState } from 'react';
import { X, Package, FileText, MapPin, Clock, CreditCard, AlertTriangle, RefreshCcw, CheckCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import MpesaPaymentModal from './MpesaPaymentModal';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';

const OrderDetailsModal = ({
    order,
    onClose,
    formatPrice,
    formatDate,
    canViewInvoice,
    canViewReceipt,
    downloadDocument,
    onOrderUpdate
}) => {
    const { delivery_fee, currency, backendUrl, token } = useContext(ShopContext);
    const [showMpesaModal, setShowMpesaModal] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(order); // Local state for order data

    // Calculate the total order value
    const calculateOrderTotal = () => {
        return currentOrder.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const checkPaymentStatus = async () => {
        if (!currentOrder?.id) {
            toast.error('No order reference found');
            return;
        }

        setIsCheckingStatus(true);

        try {
            const response = await fetch(`${backendUrl}/payment/status/${currentOrder.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`Payment status updated: ${data.payment_status}`);

                // Update local order state by merging data
                setCurrentOrder(prev => ({
                    ...prev,
                    ...data,
                    payment: data.payment_status,

                }));

                // Trigger parent component refresh
                if (onOrderUpdate) {
                    onOrderUpdate();
                }
            } else {
                toast.error(data.error || 'Failed to check payment status');
            }
        } catch (error) {
            console.error('Status check error:', error);
            toast.error('Failed to check payment status');
        } finally {
            setIsCheckingStatus(false);
        }
    };

    // Get payment status based on payment method and order status
    const getPaymentStatus = () => {
        if (currentOrder.payment_status === "Success") return "Paid";
        if (currentOrder.payment_status === "Failed") return "Failed";
        if (currentOrder.payment_status === "refunded") return "Refunded";
        if (currentOrder.payment_status === "Pending") return "Processing";
        if (currentOrder.paymentMethod === "COD" && currentOrder.status !== "Delivered") return "Unpaid";
        if (currentOrder.paymentMethod === "COD" && currentOrder.status === "Delivered") return "Paid";
        return "Unpaid";
    };

    // Check if payment can be retried
    const canRetryPayment = () => {
        const paymentStatus = getPaymentStatus();
        return (
            currentOrder.paymentMethod === "MPESA" &&
            (paymentStatus === "Failed" || paymentStatus === "Pending")
        );
    };

    // Handle retry payment
    const handleRetryPayment = () => {
        setShowMpesaModal(true);
    };

    // Handle M-Pesa modal success - refresh order details
    const handleMpesaSuccess = async () => {
        // Wait a moment then refresh order details
        checkPaymentStatus();

        // Also trigger the main order list on the Orders page to refresh
        if (onOrderUpdate) {
            onOrderUpdate();
        }
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

        const currentIndex = statuses.indexOf(currentOrder.status);

        return statuses.map((status, index) => ({
            status,
            completed: index <= currentIndex,
            current: index === currentIndex
        }));
    };

    // Combined useEffect for auto-check and scroll prevention
    useEffect(() => {
        // Disable scrolling on body
        document.body.style.overflow = 'hidden';

        // Re-enable scrolling when component unmounts
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [currentOrder]);

    // Update local state when order prop changes
    useEffect(() => {
        setCurrentOrder(order);
    }, [order]);

    useEffect(() => {
        checkPaymentStatus();
    }, [])

    return (
        <>
            <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
                <div className="bg-bgdark border border-border rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-lg">
                    {/* Modal Header */}
                    <div className="sticky top-0 z-10 p-3 sm:p-4 border-b border-border bg-bgdark flex justify-between items-center">
                        <h3 className="text-lg sm:text-xl font-bold">Order #{currentOrder.id} Details</h3>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-border/30 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-4 sm:p-6">
                        {/* Payment Success Alert */}
                        {getPaymentStatus() === "Paid" && currentOrder.paymentMethod === "MPESA" && (
                            <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={20} />
                                    <div className="flex-grow">
                                        <h4 className="font-medium text-green-400 mb-2">Payment Successful</h4>
                                        <p className="text-green-300 text-sm mb-3">
                                            Your M-Pesa payment has been completed successfully.
                                        </p>

                                        <div className="space-y-2">
                                            {currentOrder.transaction_id && (
                                                <div className="p-3 bg-green-800/30 rounded border border-green-600/20">
                                                    <p className="text-green-200 text-sm">
                                                        <span className="font-medium">Transaction ID:</span> {currentOrder.transaction_id}
                                                    </p>
                                                </div>
                                            )}

                                            {currentOrder.phone_number && (
                                                <div className="p-3 bg-green-800/30 rounded border border-green-600/20">
                                                    <p className="text-green-200 text-sm">
                                                        <span className="font-medium">Phone Number:</span> {currentOrder.phone_number}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment Failure Alert */}
                        {getPaymentStatus() === "Failed" && currentOrder.paymentMethod === "MPESA" && (
                            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="text-red-400 mt-0.5 flex-shrink-0" size={20} />
                                    <div className="flex-grow">
                                        <h4 className="font-medium text-red-400 mb-2">
                                            {getPaymentStatus() === "Failed" ? "Payment Failed" : "Payment Processing"}
                                        </h4>
                                        <p className="text-red-300 text-sm mb-3">
                                            {getPaymentStatus() === "Failed"
                                                ? "Your M-Pesa payment could not be completed."
                                                : "Your M-Pesa payment is still being processed."
                                            }
                                        </p>

                                        {/* Show failure reason if available */}
                                        {currentOrder.failure_reason && (
                                            <div className="mb-3 p-3 bg-red-800/30 rounded border border-red-600/20">
                                                <p className="text-red-200 text-sm">
                                                    <span className="font-medium">Reason:</span> {currentOrder.failure_reason}
                                                </p>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleRetryPayment}
                                            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                        >
                                            <RefreshCcw size={16} />
                                            Retry Payment
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Order Info */}
                        <div className="mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                            <div className="p-3 sm:p-4 bg-border/10 rounded-lg border border-border">
                                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                    <Clock size={16} className="text-accent" />
                                    <h4 className="font-medium text-sm sm:text-base">Order Date</h4>
                                </div>
                                <p className="text-secondary text-sm sm:text-base">{formatDate(currentOrder.created_at).fullDate}</p>
                                <p className="text-secondary text-xs sm:text-sm">{formatDate(currentOrder.created_at).time}</p>
                                <p className="text-xs text-accent mt-1">{formatDate(currentOrder.created_at).relative}</p>
                            </div>

                            <div className="p-3 sm:p-4 bg-border/10 rounded-lg border border-border">
                                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                    <Package size={16} className="text-accent" />
                                    <h4 className="font-medium text-sm sm:text-base">Order Status</h4>
                                </div>
                                <div className="mb-2">
                                    <StatusBadge status={currentOrder.status} type="order" />
                                </div>
                                <p className="text-secondary text-xs sm:text-sm">Last updated: {formatDate(currentOrder.updated_at).relative}</p>
                            </div>

                            <div className="p-3 sm:p-4 bg-border/10 rounded-lg border border-border">
                                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                    <CreditCard size={16} className="text-accent" />
                                    <h4 className="font-medium text-sm sm:text-base">Payment</h4>
                                </div>
                                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                                    <StatusBadge status={getPaymentStatus()} type="payment" />
                                    <span className="text-secondary text-xs sm:text-sm">{currentOrder.paymentMethod}</span>
                                </div>
                                <p className="text-secondary text-xs sm:text-sm">Method: {currentOrder.paymentMethod}</p>
                                {currentOrder.paymentMethod !== 'COD' && (getPaymentStatus() === 'Processing' || getPaymentStatus() === 'Pending') ? (
                                    <button
                                        onClick={checkPaymentStatus}
                                        disabled={isCheckingStatus}
                                        className="text-xs mt-1 sm:mt-2 sm:text-base px-2 py-1 sm:px-4 sm:py-2 bg-bgdark text-accent border border-accent rounded hover:bg-accent hover:text-bgdark disabled:opacity-50"
                                    >
                                        {isCheckingStatus ? 'Checking...' : 'Check Status'}
                                    </button>
                                ) : null}
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
                                {currentOrder.address ? (
                                    <>
                                        <p className="font-medium text-sm sm:text-base">{currentOrder.address.first_name} {currentOrder.address.last_name}</p>
                                        <p className="text-secondary text-xs sm:text-sm mt-1">{currentOrder.address.street}</p>
                                        <p className="text-secondary text-xs sm:text-sm">{currentOrder.address.city}</p>
                                        {currentOrder.address.phone && <p className="text-secondary text-xs sm:text-sm mt-1">Phone: {currentOrder.address.phone}</p>}
                                        {currentOrder.address.email && <p className="text-secondary text-xs sm:text-sm">Email: {currentOrder.address.email}</p>}
                                        {currentOrder.address.additionalInfo && (
                                            <p className="text-secondary text-xs sm:text-sm mt-2">
                                                <span className="font-medium">Additional Info:</span> {currentOrder.address.additionalInfo}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm sm:text-base">Address information not available</p>
                                        <p className="text-secondary text-xs sm:text-sm mt-2">Contact customer support for address details</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Order Items */}
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
                                            {currentOrder.items.map((item, index) => (
                                                <tr
                                                    key={index}
                                                    className={`${index !== currentOrder.items.length - 1 ? 'border-b border-border border-dashed' : ''}`}
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
                            {/* Retry Payment Button - Prominent placement */}
                            {canRetryPayment() && (
                                <button
                                    onClick={handleRetryPayment}
                                    className="flex items-center border border-accent bg-accent text-bgdark px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md hover:bg-bgdark hover:text-accent transition-all"
                                >
                                    <RefreshCcw size={14} className="mr-1 sm:mr-2" />
                                    Retry Payment
                                </button>
                            )}

                            {canViewInvoice && (
                                <button
                                    onClick={() => downloadDocument(currentOrder.id, 'invoice')}
                                    className="flex items-center border border-blue-500 bg-bgdark text-blue-400 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md hover:bg-blue-500 hover:text-bgdark transition-all"
                                >
                                    <FileText size={14} className="mr-1 sm:mr-2" />
                                    Download Invoice
                                </button>
                            )}

                            {canViewReceipt && (
                                <button
                                    onClick={() => downloadDocument(currentOrder.id, 'receipt')}
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

            {/* M-Pesa Payment Modal for Retry */}
            {showMpesaModal && (
                <MpesaPaymentModal
                    isOpen={showMpesaModal}
                    onClose={() => setShowMpesaModal(false)}
                    orderData={{
                        total_amount: calculateOrderTotal() + delivery_fee,
                        address: currentOrder.address,
                        payment_method: "MPESA",
                        order_reference: currentOrder.id,
                        is_retry: true
                    }}
                    onSuccess={handleMpesaSuccess}
                />
            )}
        </>
    );
};

export default OrderDetailsModal;