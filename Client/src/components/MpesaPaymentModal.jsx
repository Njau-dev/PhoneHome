import React, { useState, useContext, useEffect } from 'react';
import { X, Phone, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';

const MpesaPaymentModal = ({ isOpen, onClose, orderData, onSuccess, onModalClose }) => {
    const { backendUrl, token } = useContext(ShopContext);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [failureReason, setFailureReason] = useState('');
    const [orderReference, setOrderReference] = useState('');

    // Check if this is a retry payment
    const isRetry = orderData?.is_retry || false;

    // Format phone number
    const formatPhoneNumber = (phone) => {
        const digits = phone.replace(/\D/g, '');
        if (digits.startsWith('254')) {
            return digits;
        } else if (digits.startsWith('0')) {
            return '254' + digits.substring(1);
        } else if (digits.length === 9) {
            return '254' + digits;
        }
        return digits;
    };

    // Countdown timer for STK push
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        } else if (countdown === 0 && paymentStatus === 'pending') {
            // 2 minutes timeout - show timeout message
            setPaymentStatus('timeout');
            setIsProcessing(false);
        }
        return () => clearTimeout(timer);
    }, [countdown, paymentStatus]);

    const initiatePayment = async () => {
        if (!phoneNumber) {
            toast.error('Please enter your phone number');
            return;
        }

        const formattedPhone = formatPhoneNumber(phoneNumber);

        if (formattedPhone.length !== 12 || !formattedPhone.startsWith('254')) {
            toast.error('Please enter a valid Kenyan phone number');
            return;
        }

        setIsProcessing(true);
        setPaymentStatus('pending');
        setCountdown(120); // 2 minutes timeout

        try {
            const endpoint = isRetry ? '/mpesa/retry' : '/mpesa/initiate';
            const payload = isRetry ? {
                phone_number: formattedPhone,
                order_reference: orderData.order_reference
            } : {
                ...orderData,
                phone_number: formattedPhone
            };

            const response = await fetch(`${backendUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('STK push sent! Please check your phone and enter your M-Pesa PIN');

                // Store order reference for polling
                const referenceForPolling = isRetry ? orderData.order_reference : data.order_reference;
                setOrderReference(referenceForPolling);

                // Start polling for payment status
                startStatusPolling(referenceForPolling);
            } else {
                throw new Error(data.error || 'Failed to initiate payment');
            }
        } catch (error) {
            console.error('Payment initiation error:', error);
            toast.error(error.message || 'Failed to initiate payment');
            setPaymentStatus('failed');
            setFailureReason(error.message || 'Failed to initiate payment');
            setIsProcessing(false);
        }
    };

    const startStatusPolling = (order_reference) => {
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`${backendUrl}/payment/status/${order_reference}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (data.payment_status === 'Success') {
                    setPaymentStatus('success');
                    setIsProcessing(false);
                    setTransactionId(data.transaction_id || data.mpesa_receipt || '');
                    clearInterval(pollInterval);
                    toast.success('Payment successful!');
                    if (onSuccess) {
                        onSuccess();
                    }
                } else if (data.payment_status === 'Failed') {
                    setPaymentStatus('failed');
                    setFailureReason(data.failure_reason || 'Payment failed');
                    setIsProcessing(false);
                    clearInterval(pollInterval);
                    toast.error('Payment failed');
                }
            } catch (error) {
                console.error('Status check error:', error);
            }
        }, 5000); // Check every 5 seconds

        // Clear interval after 2 minutes when countdown reaches 0
        setTimeout(() => {
            clearInterval(pollInterval);
        }, 120000);
    };

    const handlePhoneInput = (e) => {
        const value = e.target.value;
        const cleanValue = value.replace(/[^\d]/g, '');
        setPhoneNumber(cleanValue);
    };

    const handleClose = () => {
        if (onModalClose) {
            onModalClose();
        } else {
            onClose();
        }
    };

    const handleSuccessClose = () => {
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-bgdark border border-border rounded-lg max-w-md w-full p-6 relative">
                {/* Close Button - Only show when not processing or show appropriate close */}
                {(paymentStatus === '' || paymentStatus === 'success' || paymentStatus === 'failed' || paymentStatus === 'timeout') && (
                    <button
                        onClick={paymentStatus === 'success' ? handleSuccessClose : handleClose}
                        className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors"
                    >
                        <X size={24} />
                    </button>
                )}

                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-primary mb-2">
                        {isRetry ? 'Retry M-Pesa Payment' : 'M-Pesa Payment'}
                    </h2>
                    <p className="text-secondary text-sm">
                        Total Amount: <span className="text-accent font-semibold">KSh {orderData.total_amount.toFixed(2)}</span>
                    </p>
                    {isRetry && (
                        <p className="text-accent text-xs mt-1">
                            Order Reference: {orderData.order_reference}
                        </p>
                    )}
                </div>

                {/* Payment Status Messages */}
                {paymentStatus === 'success' && (
                    <div className="mb-6 p-4 bg-green-900/20 border border-green-500 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle className="text-green-500" size={24} />
                            <p className="text-green-400 font-medium">Payment Successful!</p>
                        </div>
                        <p className="text-green-300 text-sm mb-2">
                            Your payment has been confirmed successfully.
                        </p>
                        {transactionId && (
                            <p className="text-green-200 text-xs">
                                Transaction ID: {transactionId}
                            </p>
                        )}
                    </div>
                )}

                {paymentStatus === 'failed' && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <AlertCircle className="text-red-500" size={24} />
                            <p className="text-red-400 font-medium">Payment Failed</p>
                        </div>
                        <p className="text-red-300 text-sm mb-2">
                            {failureReason || 'Payment was not successful'}
                        </p>
                        <p className="text-red-200 text-xs">
                            You can retry payment from your orders page.
                        </p>
                    </div>
                )}

                {paymentStatus === 'timeout' && (
                    <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="text-yellow-500" size={24} />
                            <p className="text-accent font-medium">Payment Delayed</p>
                        </div>
                        <p className="text-yellow-300 text-sm mb-2">
                            Payment is taking longer than expected. You'll be redirected to orders page where you can retry payment or check status.
                        </p>
                    </div>
                )}

                {paymentStatus === 'pending' && (
                    <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <Loader2 className="text-blue-400 animate-spin" size={20} />
                            <p className="text-blue-400 font-medium">STK Push Sent</p>
                        </div>
                        <p className="text-blue-300 text-sm mb-2">
                            Check your phone and enter your M-Pesa PIN to complete the payment
                        </p>
                        {countdown > 0 && (
                            <p className="text-blue-200 text-xs">
                                Timeout in: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                            </p>
                        )}
                    </div>
                )}

                {/* Phone Number Input */}
                {paymentStatus === '' && (
                    <div className="mb-6">
                        <label className="block text-primary text-sm font-medium mb-2">
                            Phone Number
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary" size={20} />
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={handlePhoneInput}
                                placeholder="0712345678 or 254712345678"
                                className="w-full pl-10 pr-4 py-3 text-primary placeholder:text-secondary bg-transparent border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
                                disabled={isProcessing}
                            />
                        </div>
                        <p className="text-secondary text-xs mt-1">
                            Enter your M-Pesa registered phone number
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    {paymentStatus === '' && (
                        <>
                            <button
                                onClick={onClose}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-2 text-secondary border border-border rounded hover:bg-border transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={initiatePayment}
                                disabled={isProcessing || !phoneNumber}
                                className="flex-1 px-4 py-2 bg-accent text-bgdark rounded hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    isRetry ? 'Retry Payment' : 'Pay Now'
                                )}
                            </button>
                        </>
                    )}

                    {paymentStatus === 'success' && (
                        <button
                            onClick={handleSuccessClose}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                            {isRetry ? 'Close' : 'Close & Continue'}
                        </button>
                    )}

                    {(paymentStatus === 'failed' || paymentStatus === 'timeout') && (
                        <button
                            onClick={handleClose}
                            className="w-full px-4 py-2 bg-accent text-bgdark rounded hover:bg-accent/90 transition-colors"
                        >
                            {isRetry ? 'Close' : 'Close & Go to Orders'}
                        </button>
                    )}
                </div>

                {/* Help Text */}
                <div className="mt-4 text-xs text-secondary">
                    <p>• Make sure your phone has sufficient M-Pesa balance</p>
                    <p>• You'll receive an STK push notification on your phone</p>
                    <p>• Enter your M-Pesa PIN when prompted</p>
                    {isRetry && <p>• This is a payment retry for an existing order</p>}
                </div>
            </div>
        </div>
    );
};

export default MpesaPaymentModal;