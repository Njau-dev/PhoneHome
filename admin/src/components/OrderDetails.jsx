import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShoppingBag, ArrowLeft, User, MapPin, Phone, Mail, CreditCard, Package, Truck, CheckCircle, Clock, AlertCircle, CalendarDays, Printer, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import Breadcrumbs from '../components/BreadCrumbs';
import Title from '../components/Title';

const OrderDetails = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { backendUrl, currency, delivery_fee } = useApp();
    const { token } = useAuth();

    // Fetch order details
    const fetchOrderDetails = async () => {
        if (!token || !id) {
            return null;
        }
        try {
            setIsLoading(true);
            const response = await axios.get(`${backendUrl}/orders/admin/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.order) {
                setOrder(response.data.order);
            } else {
                toast.error('Error occurred while fetching order details');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch order details');
        } finally {
            setIsLoading(false);
        }
    };

    // Update order status
    const statusHandler = async (event) => {
        const newStatus = event.target.value;
        try {
            const response = await axios.put(
                `${backendUrl}/orders/status/${id}`,
                { status: newStatus },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.status === 200) {
                // Update local state to reflect the change
                setOrder(prev => ({ ...prev, status: newStatus }));
                toast.success(response.data.Message || 'Order status updated successfully');
            }
        } catch (error) {
            console.error("Error updating order status:", error.response?.data || error.message);
            toast.error("Error updating order status");
        }
    };

    // Helper function to get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'Order Placed':
                return 'bg-blue-100 text-blue-800';
            case 'Packing':
                return 'bg-yellow-100 text-yellow-800';
            case 'Shipped':
                return 'bg-indigo-100 text-indigo-800';
            case 'Out for Delivery':
                return 'bg-orange-100 text-orange-800';
            case 'Delivered':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Helper function to get payment status style
    const getPaymentStatusStyle = (status) => {
        return status === 'Done'
            ? 'bg-green-100 text-green-800'
            : 'bg-amber-100 text-amber-800';
    };

    // Helper function to get status icon
    const getStatusIcon = (status) => {
        switch (status) {
            case 'Order Placed':
                return <Clock className="h-5 w-5" />;
            case 'Packing':
                return <Package className="h-5 w-5" />;
            case 'Shipped':
                return <Package className="h-5 w-5" />;
            case 'Out for Delivery':
                return <Truck className="h-5 w-5" />;
            case 'Delivered':
                return <CheckCircle className="h-5 w-5" />;
            default:
                return <AlertCircle className="h-5 w-5" />;
        }
    };

    // Format date to readable format
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';

        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    useEffect(() => {
        fetchOrderDetails();
    }, [token, id]);

    if (isLoading) {
        return (
            <div className="px-4 sm:px-6 py-6 space-y-6 max-w-full flex items-center justify-center h-screen">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
                    <p className="text-primary text-lg font-medium">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="px-4 sm:px-6 py-6 space-y-6 max-w-full">
                <Breadcrumbs />
                <div className="bg-bgdark rounded-xl p-12 border border-border shadow-xl">
                    <div className="text-center">
                        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-primary mb-2">Order Not Found</h2>
                        <p className="text-secondary mb-6">The order you're looking for doesn't exist or you don't have permission to view it.</p>
                        <Link to="/orders" className="inline-flex items-center px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 py-6 space-y-6 max-w-full">
            <Breadcrumbs />

            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col">
                    <h1 className="text-[24px] sm:text-2xl mb-2">
                        <Title text1={'Order'} text2={'Details'} />
                    </h1>
                    <div className="flex items-center">
                        <span className="text-secondary">Order ID:</span>
                        <span className="text-primary font-semibold ml-2">#{order.order_reference}</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <Link to="/orders" className="inline-flex items-center px-3 py-2 bg-bgdark text-primary rounded-lg border border-border hover:bg-gray-700/10 transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
                    </Link>
                    <button className="inline-flex items-center px-3 py-2 bg-bgdark text-primary rounded-lg border border-border hover:bg-gray-700/10 transition-colors">
                        <Printer className="h-4 w-4 mr-2" /> Print Order
                    </button>
                    <button className="inline-flex items-center px-3 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors">
                        <Download className="h-4 w-4 mr-2" /> Download Invoice
                    </button>
                </div>
            </div>

            {/* Order Status and Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Order Status Card */}
                <div className="bg-bgdark rounded-xl p-4 sm:p-6 border border-border shadow-xl transition-all duration-200 hover:shadow-accent/5">
                    <div className="flex flex-col space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium text-secondary">Order Status</h3>
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {order.status}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={order.status}
                                onChange={statusHandler}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bgdark focus:border-accent focus:outline-none transition-colors duration-300"
                            >
                                <option value="Order Placed">Order Placed</option>
                                <option value="Packing">Packing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Out for Delivery">Out for Delivery</option>
                                <option value="Delivered">Delivered</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Payment Status Card */}
                <div className="bg-bgdark rounded-xl p-4 sm:p-6 border border-border shadow-xl transition-all duration-200 hover:shadow-accent/5">
                    <div className="flex flex-col space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium text-secondary">Payment Status</h3>
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusStyle(order.payment_status)}`}>
                                {order.payment_status}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-indigo-400 to-purple-600 p-2 rounded-lg text-white">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-primary font-medium">{order.payment_method}</p>
                                <p className="text-xs text-secondary">Transaction ID: {order.transaction_id || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Date Card */}
                <div className="bg-bgdark rounded-xl p-4 sm:p-6 border border-border shadow-xl transition-all duration-200 hover:shadow-accent/5">
                    <div className="flex flex-col space-y-4">
                        <h3 className="text-sm font-medium text-secondary">Order Dates</h3>
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-2 rounded-lg text-white">
                                <CalendarDays className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-primary font-medium">{formatDate(order.created_at)}</p>
                                <p className="text-xs text-secondary">Order Date</p>
                            </div>
                        </div>
                        {order.delivered_at && (
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-green-400 to-green-600 p-2 rounded-lg text-white">
                                    <CheckCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-primary font-medium">{formatDate(order.delivered_at)}</p>
                                    <p className="text-xs text-secondary">Delivery Date</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Customer Details */}
                <div className="bg-bgdark rounded-xl p-4 sm:p-6 border border-border shadow-xl">
                    <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                        <User className="h-5 w-5 mr-2 text-accent" /> Customer Information
                    </h3>
                    <div className="space-y-4">
                        <div className="flex flex-col">
                            <span className="text-secondary text-sm">Name</span>
                            <span className="text-primary font-medium">{order.address.first_name} {order.address.last_name}</span>
                        </div>
                        <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-secondary" />
                            <span className="text-primary">{order.address.email}</span>
                        </div>
                        <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-secondary" />
                            <span className="text-primary">{order.address.phone}</span>
                        </div>
                    </div>
                </div>

                {/* Shipping Details */}
                <div className="bg-bgdark rounded-xl p-4 sm:p-6 border border-border shadow-xl">
                    <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-accent" /> Shipping Address
                    </h3>
                    <div className="space-y-4">
                        <div className="flex flex-col">
                            <span className="text-secondary text-sm">Address</span>
                            <span className="text-primary">{order.address.address_line1}</span>
                            {order.address.address_line2 && (
                                <span className="text-primary">{order.address.address_line2}</span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                                <span className="text-secondary text-sm">City</span>
                                <span className="text-primary">{order.address.city}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-secondary text-sm">Street</span>
                                <span className="text-primary">{order.address.street}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                                <span className="text-secondary text-sm">Additional Info</span>
                                <span className="text-primary">{order.address.additional_info}</span>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="bg-bgdark rounded-xl p-4 sm:p-6 border border-border shadow-xl">
                    <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                        <ShoppingBag className="h-5 w-5 mr-2 text-accent" /> Order Summary
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-secondary">Total Amount</span>
                            <span className="text-accent font-bold">{currency} {order.total_amount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Items */}
            <div className="bg-bgdark rounded-xl border border-border shadow-xl overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-border">
                    <h3 className="text-lg font-semibold text-primary">Order Items</h3>
                    <p className="text-secondary text-sm">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'} in this order
                    </p>
                </div>

                <div className="p-4 sm:p-6 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700/20">
                        <thead>
                            <tr className="bg-gray-700/5">
                                <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                                    Unit Price
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                                    Quantity
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">
                                    Total
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/20">
                            {order.items.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-700/5 transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center">
                                            <div className="h-12 w-12 rounded-md bg-gray-700/10 flex items-center justify-center overflow-hidden mr-3">
                                                {item.product.image_url ? (
                                                    <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <Package className="h-6 w-6 text-secondary" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-primary">{item.product.name}</div>
                                                {item.variation && <div className="text-xs text-secondary">{item.variation.name}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-secondary">
                                        {currency} {item.unit_price.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-secondary">
                                        {item.quantity}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-right font-medium text-primary">
                                        {currency} {item.total_price.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-bgdark rounded-xl border border-border shadow-xl overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-border">
                    <h3 className="text-lg font-semibold text-primary">Order Timeline</h3>
                    <p className="text-secondary text-sm">
                        Track the progress of this order
                    </p>
                </div>

                <div className="p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Order Placed */}
                        <div className="flex">
                            <div className="flex flex-col items-center mr-4">
                                <div className={`rounded-full p-2 ${order.status === 'Order Placed' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'}`}>
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div className="h-full w-0.5 bg-gray-300 mt-2"></div>
                            </div>
                            <div>
                                <h4 className="text-primary font-medium">Order Placed</h4>
                                <p className="text-secondary text-sm">
                                    {formatDate(order.created_at)}
                                </p>
                                <p className="text-secondary text-sm mt-1">
                                    Order #{order.order_reference} has been placed
                                </p>
                            </div>
                        </div>

                        {/* Packing */}
                        <div className="flex">
                            <div className="flex flex-col items-center mr-4">
                                <div className={`rounded-full p-2 ${['Packing', 'Shipped', 'Out for Delivery', 'Delivered'].includes(order.status) ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-800'}`}>
                                    <Package className="h-5 w-5" />
                                </div>
                                <div className="h-full w-0.5 bg-gray-300 mt-2"></div>
                            </div>
                            <div>
                                <h4 className="text-primary font-medium">Packing</h4>
                                <p className="text-secondary text-sm">
                                    {['Packing', 'Shipped', 'Out for Delivery', 'Delivered'].includes(order.status)
                                        ? formatDate(order.packing_at || order.created_at)
                                        : 'Pending'}
                                </p>
                                <p className="text-secondary text-sm mt-1">
                                    {['Packing', 'Shipped', 'Out for Delivery', 'Delivered'].includes(order.status)
                                        ? 'Your order is being packed for shipment'
                                        : 'Your order will be packed soon'}
                                </p>
                            </div>
                        </div>

                        {/* Shipped */}
                        <div className="flex">
                            <div className="flex flex-col items-center mr-4">
                                <div className={`rounded-full p-2 ${['Shipped', 'Out for Delivery', 'Delivered'].includes(order.status) ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-800'}`}>
                                    <Package className="h-5 w-5" />
                                </div>
                                <div className="h-full w-0.5 bg-gray-300 mt-2"></div>
                            </div>
                            <div>
                                <h4 className="text-primary font-medium">Shipped</h4>
                                <p className="text-secondary text-sm">
                                    {['Shipped', 'Out for Delivery', 'Delivered'].includes(order.status)
                                        ? formatDate(order.shipped_at || order.created_at)
                                        : 'Pending'}
                                </p>
                                <p className="text-secondary text-sm mt-1">
                                    {['Shipped', 'Out for Delivery', 'Delivered'].includes(order.status)
                                        ? `Your order has been shipped ${order.tracking_number ? `(Tracking: ${order.tracking_number})` : ''}`
                                        : 'Your order will be shipped soon'}
                                </p>
                            </div>
                        </div>

                        {/* Out for Delivery */}
                        <div className="flex">
                            <div className="flex flex-col items-center mr-4">
                                <div className={`rounded-full p-2 ${['Out for Delivery', 'Delivered'].includes(order.status) ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-800'}`}>
                                    <Truck className="h-5 w-5" />
                                </div>
                                <div className="h-full w-0.5 bg-gray-300 mt-2"></div>
                            </div>
                            <div>
                                <h4 className="text-primary font-medium">Out for Delivery</h4>
                                <p className="text-secondary text-sm">
                                    {['Out for Delivery', 'Delivered'].includes(order.status)
                                        ? formatDate(order.out_for_delivery_at || order.created_at)
                                        : 'Pending'}
                                </p>
                                <p className="text-secondary text-sm mt-1">
                                    {['Out for Delivery', 'Delivered'].includes(order.status)
                                        ? 'Your order is out for delivery'
                                        : 'Your order will be out for delivery soon'}
                                </p>
                            </div>
                        </div>

                        {/* Delivered */}
                        <div className="flex">
                            <div className="flex flex-col items-center mr-4">
                                <div className={`rounded-full p-2 ${order.status === 'Delivered' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-800'}`}>
                                    <CheckCircle className="h-5 w-5" />
                                </div>
                            </div>
                            <div>
                                <h4 className="text-primary font-medium">Delivered</h4>
                                <p className="text-secondary text-sm">
                                    {order.status === 'Delivered'
                                        ? formatDate(order.delivered_at || order.created_at)
                                        : 'Pending'}
                                </p>
                                <p className="text-secondary text-sm mt-1">
                                    {order.status === 'Delivered'
                                        ? 'Your order has been delivered successfully'
                                        : 'Your order will be delivered soon'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notes and Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order Notes */}
                <div className="bg-bgdark rounded-xl p-4 sm:p-6 border border-border shadow-xl">
                    <h3 className="text-lg font-semibold text-primary mb-4">Order Notes</h3>
                    <textarea
                        className="w-full h-32 px-3 py-2 text-sm rounded-lg border border-border bg-bgdark focus:border-accent focus:outline-none transition-colors duration-300"
                        placeholder="Add notes about this order (admin only)"
                        value={order.notes || ''}
                        readOnly={true}
                    ></textarea>
                    <div className="flex justify-end mt-3">
                        <button className="inline-flex items-center px-3 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors">
                            Save Notes
                        </button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-bgdark rounded-xl p-4 sm:p-6 border border-border shadow-xl">
                    <h3 className="text-lg font-semibold text-primary mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button className="inline-flex items-center justify-center px-3 py-3 bg-bgdark text-primary rounded-lg border border-border hover:bg-gray-700/10 transition-colors">
                            <Mail className="h-4 w-4 mr-2" /> Email Customer
                        </button>
                        <button className="inline-flex items-center justify-center px-3 py-3 bg-bgdark text-primary rounded-lg border border-border hover:bg-gray-700/10 transition-colors">
                            <Printer className="h-4 w-4 mr-2" /> Print Packing Slip
                        </button>
                        <button className="inline-flex items-center justify-center px-3 py-3 bg-bgdark text-primary rounded-lg border border-border hover:bg-gray-700/10 transition-colors">
                            <Download className="h-4 w-4 mr-2" /> Download Invoice
                        </button>
                        <button className="inline-flex items-center justify-center px-3 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                            <AlertCircle className="h-4 w-4 mr-2" /> Cancel Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;