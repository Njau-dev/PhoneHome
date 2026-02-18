import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
    Package,
    Truck,
    Search,
    Clock,
    CheckCircle,
    ShoppingBag,
    Filter,
    ChevronLeft,
    ChevronRight,
    ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/BreadCrumbs';
import Title from '../components/Title';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState('All');
    const [statsData, setStatsData] = useState({
        total: 0,
        orderPlaced: 0,
        packing: 0,
        shipped: 0,
        outForDelivery: 0,
        delivered: 0
    });
    const [isLoading, setIsLoading] = useState(false);

    const ordersPerPage = 10;
    const { backendUrl, currency } = useApp();
    const { token } = useAuth();

    // Function to fetch all orders
    const fetchAllOrders = async () => {
        if (!token) {
            return null;
        }

        try {
            setIsLoading(true);
            const response = await axios.get(backendUrl + '/orders/admin/all', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.data.orders.length > 0) {
                const ordersData = response.data.data.orders.reverse();
                setOrders(ordersData);
                setFilteredOrders(ordersData);
                calculateStats(ordersData);
            } else {
                toast.info('No orders found');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch orders');
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate statistics for different order statuses
    const calculateStats = (ordersData) => {
        const stats = {
            total: ordersData.length,
            orderPlaced: ordersData.filter(order => order.status === 'Order Placed').length,
            packing: ordersData.filter(order => order.status === 'Packing').length,
            shipped: ordersData.filter(order => order.status === 'Shipped').length,
            outForDelivery: ordersData.filter(order => order.status === 'Out for Delivery').length,
            delivered: ordersData.filter(order => order.status === 'Delivered').length
        };
        setStatsData(stats);
    };

    // Function to update order status
    const statusHandler = async (event, orderId) => {
        const newStatus = event.target.value;

        try {
            const response = await axios.put(
                `${backendUrl}/orders/status/${orderId}`,
                { status: newStatus },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 200) {
                await fetchAllOrders();
                toast.success(response.data.Message || 'Order status updated successfully');
            }
        } catch (error) {
            console.error("Error updating order status:", error.response?.data || error.message);
            toast.error("Error updating order status");
        }
    };

    // Function to handle search
    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);

        if (term.trim() === '') {
            filterOrdersByTab(activeTab);
        } else {
            const filtered = orders.filter(order =>
                order.order_reference.toLowerCase().includes(term) ||
                (order.address.first_name + ' ' + order.address.last_name).toLowerCase().includes(term) ||
                order.address.email.toLowerCase().includes(term) ||
                order.address.phone.toLowerCase().includes(term)
            );

            if (activeTab !== 'All') {
                setFilteredOrders(filtered.filter(order => order.status === activeTab));
            } else {
                setFilteredOrders(filtered);
            }
        }
        setCurrentPage(1); // Reset to first page when searching
    };

    // Function to filter orders by status tab
    const filterOrdersByTab = (tab) => {
        setActiveTab(tab);

        if (tab === 'All') {
            if (searchTerm.trim() === '') {
                setFilteredOrders(orders);
            } else {
                handleSearch({ target: { value: searchTerm } });
            }
        } else {
            const filtered = orders.filter(order => order.status === tab);

            if (searchTerm.trim() !== '') {
                setFilteredOrders(filtered.filter(order =>
                    order.order_reference.toLowerCase().includes(searchTerm) ||
                    (order.address.first_name + ' ' + order.address.last_name).toLowerCase().includes(searchTerm) ||
                    order.address.email.toLowerCase().includes(searchTerm) ||
                    order.address.phone.toLowerCase().includes(searchTerm)
                ));
            } else {
                setFilteredOrders(filtered);
            }
        }
        setCurrentPage(1); // Reset to first page when changing tabs
    };

    // Pagination helpers
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

    // Pagination controls
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    // Calculate the page numbers to display
    const getPageNumbers = () => {
        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        } else if (currentPage <= 3) {
            return [1, 2, 3, 4, 5];
        } else if (currentPage >= totalPages - 2) {
            return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
            return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
        }
    };

    useEffect(() => {
        fetchAllOrders();
    }, [token]);

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

    // Helper function to get payment status color
    const getPaymentStatusColor = (status) => {
        return status === 'Done' ? 'text-green-500' : 'text-amber-500';
    };

    return (
        <div className="px-4 sm:px-6 py-6 space-y-6 max-w-full">
            <Breadcrumbs />

            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-[24px] sm:text-2xl">
                    <Title text1={'Order'} text2={'Management'} />
                </h1>

                <div className="relative w-full md:w-1/2">
                    <input
                        type="text"
                        placeholder="Search orders by ID, customer name, email, phone..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-bgdark focus:border-accent focus:outline-none transition-colors duration-300"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-secondary" />
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
                {/* Total Orders Card */}
                <div className="bg-bgdark rounded-xl p-4 sm:p-6 border border-border shadow-xl transition-all duration-200 hover:shadow-accent/5">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-medium text-secondary">Total Orders</h3>
                            <div className="mt-2">
                                <p className="text-2xl font-semibold text-primary">{statsData.total}</p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-400 to-indigo-600 p-3 rounded-lg text-white">
                            <ShoppingBag className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                {/* Order Placed Card */}
                <div className="bg-bgdark rounded-xl p-4 sm:p-6 border border-border shadow-xl transition-all duration-200 hover:shadow-accent/5">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-medium text-secondary">Order Placed</h3>
                            <div className="mt-2">
                                <p className="text-2xl font-semibold text-primary">{statsData.orderPlaced}</p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-3 rounded-lg text-white">
                            <Clock className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                {/* Packing Card */}
                <div className="bg-bgdark rounded-xl p-4 sm:p-6 border border-border shadow-xl transition-all duration-200 hover:shadow-accent/5">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-medium text-secondary">Packing</h3>
                            <div className="mt-2">
                                <p className="text-2xl font-semibold text-primary">{statsData.packing}</p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-3 rounded-lg text-white">
                            <Package className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                {/* Shipped Card */}
                <div className="bg-bgdark rounded-xl p-4 sm:p-6 border border-border shadow-xl transition-all duration-200 hover:shadow-accent/5">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-medium text-secondary">Shipped</h3>
                            <div className="mt-2">
                                <p className="text-2xl font-semibold text-primary">{statsData.shipped}</p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-400 to-indigo-600 p-3 rounded-lg text-white">
                            <Package className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                {/* Out for Delivery Card */}
                <div className="bg-bgdark rounded-xl p-4 sm:p-6 border border-border shadow-xl transition-all duration-200 hover:shadow-accent/5">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-medium text-secondary">Out for Delivery</h3>
                            <div className="mt-2">
                                <p className="text-2xl font-semibold text-primary">{statsData.outForDelivery}</p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-3 rounded-lg text-white">
                            <Truck className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                {/* Delivered Card */}
                <div className="bg-bgdark rounded-xl p-4 sm:p-6 border border-border shadow-xl transition-all duration-200 hover:shadow-accent/5">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-medium text-secondary">Delivered</h3>
                            <div className="mt-2">
                                <p className="text-2xl font-semibold text-primary">{statsData.delivered}</p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-400 to-green-600 p-3 rounded-lg text-white">
                            <CheckCircle className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="bg-bgdark rounded-lg overflow-hidden shadow-xl border border-border">
                <div className="border-b border-border">
                    <nav className="flex overflow-x-auto scrollbar-none" aria-label="Tabs">
                        {['All', 'Order Placed', 'Packing', 'Shipped', 'Out for Delivery', 'Delivered'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => filterOrdersByTab(tab)}
                                className={`whitespace-nowrap px-4 sm:px-6 py-3 text-sm font-medium border-b-2 ${activeTab === tab
                                    ? 'border-accent text-accent'
                                    : 'border-transparent text-secondary hover:text-primary hover:border-gray-300'
                                    }`}
                            >
                                {tab}
                                {tab === 'All'
                                    ? ` (${statsData.total})`
                                    : tab === 'Order Placed'
                                        ? ` (${statsData.orderPlaced})`
                                        : tab === 'Packing'
                                            ? ` (${statsData.packing})`
                                            : tab === 'Shipped'
                                                ? ` (${statsData.shipped})`
                                                : tab === 'Out for Delivery'
                                                    ? ` (${statsData.outForDelivery})`
                                                    : ` (${statsData.delivered})`}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Orders List */}
                <div className="px-3 sm:px-6 py-4">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/20">
                            <thead>
                                <tr className="bg-gray-700/5">
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                                        Order ID
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                                        Items
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                                        Payment
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-secondary uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/20">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 sm:px-6 py-4 text-center text-secondary">
                                            Loading orders...
                                        </td>
                                    </tr>
                                ) : currentOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 sm:px-6 py-4 text-center text-secondary">
                                            No orders found.
                                        </td>
                                    </tr>
                                ) : (
                                    currentOrders.map((order, index) => (
                                        <tr key={index} className="hover:bg-gray-700/5 transition-colors">
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                                                #{order.order_reference}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-secondary">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-primary">{order.address.first_name} {order.address.last_name}</span>
                                                    <span className="text-xs">{order.address.email}</span>
                                                    <span className="text-xs">{order.address.phone}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-secondary">
                                                <span className="font-medium text-primary">{order.items.length} items</span>
                                                <div className="text-xs mt-1">
                                                    {order.items.slice(0, 2).map((item, idx) => (
                                                        <div key={idx} className="truncate max-w-[150px]">
                                                            {item.name} x{item.quantity}
                                                        </div>
                                                    ))}
                                                    {order.items.length > 2 && (
                                                        <div className="text-secondary italic">+{order.items.length - 2} more...</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                                                {currency} {order.total_amount.toLocaleString()}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-secondary">
                                                <div className="flex flex-col">
                                                    <span>{order.payment_method}</span>
                                                    <span className={getPaymentStatusColor(order.payment_status)}>
                                                        {order.payment_status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-secondary">
                                                <select
                                                    value={order.status}
                                                    onChange={(event) => statusHandler(event, order.id)}
                                                    className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}
                                                >
                                                    <option value="Order Placed">Order Placed</option>
                                                    <option value="Packing">Packing</option>
                                                    <option value="Shipped">Shipped</option>
                                                    <option value="Out for Delivery">Out for Delivery</option>
                                                    <option value="Delivered">Delivered</option>
                                                </select>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right">
                                                <Link
                                                    to={`/orders/${order.id}`}
                                                    className="inline-flex items-center px-3 py-1 rounded-md bg-accent hover:bg-accent/90 text-white text-xs font-medium transition-colors"
                                                >
                                                    View <ExternalLink className="ml-1 h-3 w-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {filteredOrders.length > 0 && (
                    <div className="px-4 sm:px-6 py-3 flex items-center justify-between border-t border-gray-700/20">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={goToPrevPage}
                                disabled={currentPage === 1}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border ${currentPage === 1
                                    ? 'bg-gray-700/5 border-gray-700/20 text-gray-500 cursor-not-allowed'
                                    : 'bg-bgdark border-border text-primary hover:bg-gray-700/10'
                                    }`}
                            >
                                Previous
                            </button>
                            <button
                                onClick={goToNextPage}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className={`ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border ${currentPage === totalPages || totalPages === 0
                                    ? 'bg-gray-700/5 border-gray-700/20 text-gray-500 cursor-not-allowed'
                                    : 'bg-bgdark border-border text-primary hover:bg-gray-700/10'
                                    }`}
                            >
                                Next
                            </button>
                        </div>

                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-secondary">
                                    Showing <span className="font-medium">{indexOfFirstOrder + 1}</span> to{' '}
                                    <span className="font-medium">{Math.min(indexOfLastOrder, filteredOrders.length)}</span> of{' '}
                                    <span className="font-medium">{filteredOrders.length}</span> results
                                </p>
                            </div>

                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={goToPrevPage}
                                        disabled={currentPage === 1}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${currentPage === 1
                                            ? 'bg-gray-700/5 border-gray-700/20 text-gray-500 cursor-not-allowed'
                                            : 'bg-bgdark border-border text-primary hover:bg-gray-700/10'
                                            }`}
                                    >
                                        <span className="sr-only">Previous</span>
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>

                                    {getPageNumbers().map((pageNumber) => (
                                        <button
                                            key={pageNumber}
                                            onClick={() => paginate(pageNumber)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNumber
                                                ? 'bg-bgdark border-accent text-accent'
                                                : 'bg-bgdark border-border text-primary hover:bg-gray-700/10'
                                                }`}
                                        >
                                            {pageNumber}
                                        </button>
                                    ))}

                                    <button
                                        onClick={goToNextPage}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${currentPage === totalPages || totalPages === 0
                                            ? 'bg-gray-700/5 border-gray-700/20 text-gray-500 cursor-not-allowed'
                                            : 'bg-bgdark border-border text-primary hover:bg-gray-700/10'
                                            }`}
                                    >
                                        <span className="sr-only">Next</span>
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;