import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import axios from 'axios';
import Breadcrumbs from '../components/BreadCrumbs';
import { RefreshCcw, Package, ArrowRight, Clock } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import BrandedSpinner from '../components/BrandedSpinner';

const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [orderData, setOrderData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

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
    if (item.payment === "successful") return "Paid";
    if (item.payment === "failed") return "Failed";
    if (item.payment === "refunded") return "Refunded";
    if (item.paymentMethod === "COD" && item.status !== "Delivered") return "Unpaid";
    if (item.paymentMethod === "COD" && item.status === "Delivered") return "Paid";
    return "Unpaid";
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
        let allOrderItems = [];

        response.data.orders.forEach((order) => {
          order.items.forEach((item) => {
            item.status = order.status;
            item.payment = order.payment;
            item.paymentMethod = order.payment_method;
            item.date = order.created_at;
            item.orderId = order.order_reference || `ORD-${Math.floor(Math.random() * 10000)}`;
            allOrderItems.push(item);
          });
        });

        setOrderData(allOrderItems.reverse());
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
          date: item.date,
          status: item.status,
          paymentMethod: item.paymentMethod,
          payment: item.payment,
          items: []
        };
      }
      groupedOrders[item.orderId].items.push(item);
    });

    return Object.values(groupedOrders);
  };

  useEffect(() => {
    loadOrderData();
  }, [token]);

  return (
    <>
      <Breadcrumbs />
      <div className="bg-bgdark text-primary pt-4 sm:pt-8 pb-16">
        <div className="container mx-auto px-4 xl:px-0 max-w-screen-2xl">
          {/* Page Header */}
          <div className="mb-8 text-center text-[27px] sm:text-3xl">
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
              <h3 className="text-xl font-bold mb-2">No orders yet</h3>
              <p className="text-secondary mb-8">Start shopping to see your orders here</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-bgdark rounded-xl p-6 border border-border hover:border-accent transition-all shadow-md hover:shadow-lg shadow-black/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium">Total Orders</h3>
                    <div className="p-2 bg-accent/20 rounded-full">
                      <Package className="w-5 h-5 text-accent" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold">{getGroupedOrders().length}</p>
                  <p className="text-secondary text-sm mt-4">Orders placed</p>
                </div>

                <div className="bg-bgdark rounded-xl p-6 border border-border hover:border-accent transition-all shadow-md hover:shadow-lg shadow-black/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium">Processing</h3>
                    <div className="p-2 bg-blue-500/20 rounded-full">
                      <Clock className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold">
                    {getGroupedOrders().filter(order =>
                      order.status !== 'Delivered' && order.status !== 'Order Placed'
                    ).length}
                  </p>
                  <p className="text-secondary text-sm mt-4">Orders in progress</p>
                </div>

                <div className="bg-bgdark rounded-xl p-6 border border-border hover:border-accent transition-all shadow-md hover:shadow-lg shadow-black/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium">Delivered</h3>
                    <div className="p-2 bg-green-500/20 rounded-full">
                      <ArrowRight className="w-5 h-5 text-green-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold">
                    {getGroupedOrders().filter(order => order.status === 'Delivered').length}
                  </p>
                  <p className="text-secondary text-sm mt-4">Completed orders</p>
                </div>

                <div className="bg-bgdark rounded-xl p-6 border border-border hover:border-accent transition-all shadow-md hover:shadow-lg shadow-black/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium">Items</h3>
                    <div className="p-2 bg-purple-500/20 rounded-full">
                      <Package className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold">{orderData.length}</p>
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
                          {formatDate(order.date).fullDate} at {formatDate(order.date).time}
                          <span className="ml-2 text-xs">({formatDate(order.date).relative})</span>
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
                        </div>
                      ))}
                    </div>

                    {/* Order Footer */}
                    <div className="p-4 border-t border-border bg-border/10 flex flex-col sm:flex-row items-center justify-between">
                      <div className="text-sm text-secondary mb-3 sm:mb-0">
                        Total Items: <span className="font-medium text-primary">{order.items.length}</span>
                      </div>

                      <div className="flex gap-3">
                        <button className="border border-accent bg-accent text-bgdark px-4 py-2 text-sm font-medium rounded-md hover:bg-transparent hover:text-accent transition-all">
                          Track Order
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Orders;