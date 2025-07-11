import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import axios from 'axios';
import Breadcrumbs from '../components/BreadCrumbs';
import { RefreshCcw, Package, ArrowRight, Clock, Star, AlertTriangle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import BrandedSpinner from '../components/BrandedSpinner';
import OrderDetailsModal from '../components/OrderDetailsModal';
import ReviewModal from '../components/ReviewModal';
import { toast } from 'react-toastify';

const Orders = () => {
  const { backendUrl, token, currency, delivery_fee } = useContext(ShopContext);
  const [orderData, setOrderData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [reviewModalData, setReviewModalData] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [retryOrderData, setRetryOrderData] = useState(null);

  // Format price for display
  const formatPrice = (price) => {
    return price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Format date for better display
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    // Add 3 hours to the date
    date.setHours(date.getHours() + 3);

    return {
      fullDate: date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      relative: getRelativeTimeString(date)
    };
  };

  // Get relative time (e.g., "2 days ago")
  const getRelativeTimeString = (date) => {
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
      }
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Determine payment status based on payment method and order status
  const getPaymentStatus = (item) => {
    if (item.payment === "Success" || item.payment === "success") return "Paid";
    if (item.payment === "Failed" || item.payment === "failed") return "Failed";
    if (item.payment === "Pending" || item.payment === "pending") return "Processing";
    if (item.payment === "Cancelled" || item.payment === "cancelled") return "Cancelled";
    if (item.payment === "refunded") return "Refunded";
    if (item.paymentMethod === "COD" && item.status !== "Delivered") return "Unpaid";
    if (item.paymentMethod === "COD" && item.status === "Delivered") return "Paid";
    return "Unpaid";
  };

  // Check if payment can be retried
  const canRetryPayment = (order) => {
    const paymentStatus = getPaymentStatus(order);
    return (
      order.paymentMethod === "MPESA" &&
      (paymentStatus === "Failed" || paymentStatus === "Pending" || paymentStatus === "Cancelled")
    );
  };

  // Handle payment retry
  const handleRetryPayment = (order) => {
    const orderTotal = order.items.reduce((total, item) => total + (item.price * item.quantity), 0);

    setRetryOrderData({
      order_reference: order.id,
      total_amount: orderTotal + delivery_fee,
      address: order.address,
      payment_method: "MPESA",
      is_retry: true
    });
    setShowMpesaModal(true);
  };

  // Track order function - simply refreshes the order data
  const handleTrackOrder = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // View order details function
  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  // Open review modal
  const handleOpenReviewModal = (item) => {
    setReviewModalData({
      productId: item.product_id,
      productName: item.name,
      productImage: item.image_url,
    });
    setShowReviewModal(true);
  };

  // Close review modal
  const handleCloseReviewModal = (wasSubmitted = false, reviewData = null) => {
    // If a review was submitted with rating data
    if (wasSubmitted && reviewData) {
      // Find the item that was reviewed and update its review property
      const updatedOrderData = orderData.map(item => {
        if (item.product_id === reviewModalData.productId) {
          return {
            ...item,
            review: reviewData
          };
        }
        return item;
      });

      setOrderData(updatedOrderData);
    }

    setShowReviewModal(false);
    setReviewModalData(null);
  };

  // Load order data from API
  const loadOrderData = async () => {
    setIsLoading(true);
    setIsError(false);

    try {
      if (!token) {
        setIsLoading(false);
        return null;
      }

      const response = await axios.get(`${backendUrl}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.orders) {
        // Sort orders by the most recently updated
        const sortedOrders = response.data.orders.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

        let allOrderItems = [];

        sortedOrders.forEach((order) => {
          // Create a shared address object for all items in this order
          const orderAddress = order.address;

          order.items.forEach((item) => {
            item.status = order.status;
            item.payment = order.payment;
            item.failure_reason = order.failure_reason;
            item.checkout_request_id = order.checkout_request_id;
            item.paymentMethod = order.payment_method;
            item.created_at = order.created_at;
            item.updated_at = order.updated_at;
            item.orderId = order.order_reference;
            item.product_id = item.product_id;
            item.address = orderAddress;
            item.review = item.review || null;
            allOrderItems.push(item);
          });
        });

        setOrderData(allOrderItems);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Group orders by orderId
  const getGroupedOrders = () => {
    const groupedOrders = {};

    orderData.forEach(item => {
      if (!groupedOrders[item.orderId]) {
        groupedOrders[item.orderId] = {
          id: item.orderId,
          created_at: item.created_at,
          updated_at: item.updated_at,
          status: item.status,
          paymentMethod: item.paymentMethod,
          payment: item.payment,
          failure_reason: item.failure_reason,
          checkout_request_id: item.checkout_request_id,
          address: item.address,
          items: []
        };
      }
      groupedOrders[item.orderId].items.push(item);
    });

    return Object.values(groupedOrders);
  };

  // Get order statistics
  const getOrderStats = () => {
    const groupedOrders = getGroupedOrders();

    return {
      total: groupedOrders.length,
      processing: groupedOrders.filter(order =>
        order.status !== 'Delivered' &&
        order.status !== 'Order Placed' &&
        getPaymentStatus(order) !== 'Failed'
      ).length,
      delivered: groupedOrders.filter(order => order.status === 'Delivered').length,
      failed: groupedOrders.filter(order => {
        const paymentStatus = getPaymentStatus(order);
        return paymentStatus === 'Failed' || paymentStatus === 'Cancelled';
      }).length,
      totalItems: orderData.length
    };
  };

  // Download invoice or receipt
  const downloadDocument = async (orderId, docType) => {
    let toastId = null;
    try {
      // Show loading indicator
      toastId = toast.loading(`Generating ${docType}...`);

      // Convert document type to lowercase for API URL
      const docTypeParam = docType.toLowerCase();

      const response = await axios.get(`${backendUrl}/payment/${orderId}/${docTypeParam}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create a blob URL for the PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${docType}_${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Update toast with success message
      toast.update(toastId, {
        render: `${docType} downloaded successfully!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
        closeOnClick: true
      });
    } catch (error) {
      console.error(`Error downloading ${docType}:`, error);

      // Extract error message if available
      let errorMessage = `Could not download ${docType}.`;
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage += ` ${error.response.data.error}`;
      } else {
        errorMessage += ' Please try again later.';
      }

      // Dismiss the loading toast if it exists
      if (toastId) {
        toast.dismiss(toastId);
      }

      // Show error toast
      toast.error(errorMessage, {
        autoClose: 5000,
        closeOnClick: true
      });
    }
  };

  // Check if user can see invoice (if order is processing)
  const canViewInvoice = (status) => {
    return status === 'Order Placed' || status === 'Packing' ||
      status === 'Shipped' || status === 'Out for Delivery';
  };

  // Check if user can see receipt (if order is delivered and paid)
  const canViewReceipt = (status, payment) => {
    return status === 'Delivered' && (payment === 'Success' || payment === 'Paid');
  };

  // Check if user can review a product (if order is delivered)
  const canReviewProduct = (status) => {
    return status === 'Delivered';
  };

  useEffect(() => {
    loadOrderData();
  }, [token, refreshTrigger]);

  const orderStats = getOrderStats();

  const handleOrderUpdate = () => {
    // Trigger refresh by incrementing the refreshTrigger
    setRefreshTrigger(prev => prev + 1);
  };


  return (
    <>
      <Breadcrumbs />
      <div className="bg-bgdark text-primary pt-6 sm:pt-8 pb-10 sm:pb-16">
        <div className="container mx-auto sm:px-4 xl:px-0 max-w-screen-2xl">
          {/* Page Header */}
          <div className="mb-8 text-center text-[20px] sm:text-3xl">
            <Title text1={'MY'} text2={'ORDERS'} />
            <p className="text-secondary w-3/4 m-auto text-sm sm:text-base mx-auto">
              Track and manage your order history
            </p>
          </div>

          {/* Main Content */}
          {isLoading ? (
            <div className="flex justify-center items-center min-h-64 py-16">
              <BrandedSpinner message='Loading your orders...' />
            </div>
          ) : isError ? (
            <div className="flex flex-col justify-center items-center min-h-64 py-16 text-center">
              <h2 className="text-2xl mb-4">Something went wrong</h2>
              <p className="text-gray-400 mb-6">We couldn't load your order information</p>
              <button
                onClick={loadOrderData}
                className="flex items-center bg-accent text-bgdark px-6 py-3 rounded-full hover:bg-bgdark hover:text-accent hover:border border-accent transition-all"
              >
                <RefreshCcw size={18} className="mr-2" />
                Try Again
              </button>
            </div>
          ) : orderData.length === 0 ? (
            <div className="text-center py-12 bg-bgdark rounded-xl p-6 border border-border transition-all shadow-md hover:shadow-lg shadow-black/30">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">No orders yet</h3>
              <p className="text-secondary text-sm mb-6 sm:mb-8">Start shopping to see your orders here</p>
              <button
                onClick={() => window.location.href = '/collection'}
                className="bg-accent text-bgdark px-8 py-3 rounded-full hover:bg-bgdark hover:text-accent hover:border border-accent transition-all"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Order Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-bgdark rounded-xl p-6 border border-border hover:border-accent transition-all shadow-md hover:shadow-lg shadow-black/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium">Total Orders</h3>
                    <div className="p-2 bg-accent/20 rounded-full">
                      <Package className="w-5 h-5 text-accent" />
                    </div>
                  </div>
                        <p className="text-3xl font-bold">{orderStats.total}</p>
                  <p className="text-secondary text-sm mt-4">Orders placed</p>
                </div>

                <div className="bg-bgdark rounded-xl p-6 border border-border hover:border-accent transition-all shadow-md hover:shadow-lg shadow-black/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium">Processing</h3>
                    <div className="p-2 bg-blue-500/20 rounded-full">
                      <Clock className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>
                        <p className="text-3xl font-bold">{orderStats.processing}</p>
                  <p className="text-secondary text-sm mt-4">Orders in progress</p>
                </div>

                <div className="bg-bgdark rounded-xl p-6 border border-border hover:border-accent transition-all shadow-md hover:shadow-lg shadow-black/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium">Delivered</h3>
                    <div className="p-2 bg-green-500/20 rounded-full">
                      <ArrowRight className="w-5 h-5 text-green-400" />
                    </div>
                  </div>
                        <p className="text-3xl font-bold">{orderStats.delivered}</p>
                  <p className="text-secondary text-sm mt-4">Completed orders</p>
                </div>

                      <div className="bg-bgdark rounded-xl p-6 border border-border hover:border-red-500 transition-all shadow-md hover:shadow-lg shadow-black/30">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-medium">Failed</h3>
                          <div className="p-2 bg-red-500/20 rounded-full">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                          </div>
                        </div>
                        <p className="text-3xl font-bold text-red-400">{orderStats.failed}</p>
                        <p className="text-secondary text-sm mt-4">Payment failed</p>
                      </div>

                <div className="bg-bgdark rounded-xl p-6 border border-border hover:border-accent transition-all shadow-md hover:shadow-lg shadow-black/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium">Items</h3>
                    <div className="p-2 bg-purple-500/20 rounded-full">
                      <Package className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>
                        <p className="text-3xl font-bold">{orderStats.totalItems}</p>
                  <p className="text-secondary text-sm mt-4">Total items purchased</p>
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-6">
                {getGroupedOrders().map((order) => (
                  <div
                    key={order.id}
                    className="bg-bgdark rounded-xl border border-border hover:border-accent/50 transition-all shadow-md hover:shadow-lg shadow-black/30 overflow-hidden"
                  >
                    {/* Order Header */}
                    <div className="p-4 border-b border-border bg-border/10 flex flex-col sm:flex-row justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold">Order #{order.id}</h3>
                          <StatusBadge status={order.status} type="order" />
                        </div>
                        <p className="text-sm text-secondary">
                          {formatDate(order.created_at).fullDate} at {formatDate(order.created_at).time}
                          <span className="ml-2 text-xs">({formatDate(order.created_at).relative})</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-2 sm:mt-0">
                        <StatusBadge
                          status={getPaymentStatus(order)}
                          type="payment"
                        />
                        <p className="text-sm font-medium">
                          {order.paymentMethod}
                        </p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-4">
                      {order.items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 ${itemIndex !== order.items.length - 1 ? 'border-b border-border border-dashed' : ''
                            }`}
                        >
                          <div className="flex-shrink-0">
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded-md border border-border"
                            />
                          </div>

                          <div className="flex-grow">
                            <h4 className="font-medium mb-1">{item.name}</h4>
                            {item.variation_name && (
                              <p className="text-sm text-secondary mb-1">Variation: {item.variation_name}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                              <p className="text-sm">
                                <span className="text-secondary">Price:</span> {currency} {formatPrice(item.price)}
                              </p>
                              <p className="text-sm">
                                <span className="text-secondary">Qty:</span> {item.quantity}
                              </p>
                              <p className="text-sm font-medium">
                                <span className="text-secondary">Total:</span> {currency} {formatPrice(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>

                          {/* Review Button or Rating Display - only shown for delivered items */}
                          {canReviewProduct(order.status) && (
                            <div className="mt-3 sm:mt-0 ml-auto sm:ml-2">
                              {item.review ? (
                                // If item has been reviewed, show the rating
                                <div className="flex items-center text-xs sm:text-sm bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full">
                                  <Star size={14} className="mr-1" />
                                  Rating: {item.review.rating}/5
                                </div>
                              ) : (
                                // If not reviewed, show review button
                                <button
                                  onClick={() => handleOpenReviewModal(item)}
                                  className="flex items-center text-xs sm:text-sm bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full hover:bg-amber-500 hover:text-bgdark transition-all"
                                >
                                  <Star size={14} className="mr-1" />
                                  Review
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Order Footer */}
                    <div className="p-4 border-t border-border bg-border/10 flex flex-col sm:flex-row items-center justify-between">
                      <div className="text-sm text-secondary mb-3 sm:mb-0">
                        Total Items: <span className="font-medium text-primary">{order.items.length}</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewOrderDetails(order)}
                            className="border border-accent bg-bgdark text-accent px-4 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-bgdark transition-all"
                          >
                            View Details
                          </button>

                          <button
                            onClick={handleTrackOrder}
                            className="border border-accent bg-accent text-bgdark px-4 py-2 text-sm font-medium rounded-md hover:bg-transparent hover:text-accent transition-all"
                          >
                            Track Order
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowDetailsModal(false)}
          formatPrice={formatPrice}
          formatDate={formatDate}
          canViewInvoice={canViewInvoice(selectedOrder.status)}
          canViewReceipt={canViewReceipt(selectedOrder.status, selectedOrder.payment)}
          downloadDocument={downloadDocument}
          canRetryPayment={canRetryPayment(selectedOrder)}
          onRetryPayment={() => {
            setShowDetailsModal(false);
            handleRetryPayment(selectedOrder);
          }}
          onOrderUpdate={handleOrderUpdate}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && reviewModalData && (
        <ReviewModal
          productId={reviewModalData.productId}
          productName={reviewModalData.productName}
          productImage={reviewModalData.productImage}
          onClose={handleCloseReviewModal}
          backendUrl={backendUrl}
          token={token}
        />
      )}
    </>
  );
};

export default Orders;