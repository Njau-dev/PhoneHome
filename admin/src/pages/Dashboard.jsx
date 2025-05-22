import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TrendingUp, TrendingDown, Package, ShoppingBag, Users, AlertCircle, CreditCard, BarChart3, LineChart, ArrowRight, ExternalLink } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import Breadcrumbs from '../components/BreadCrumbs';

const Dashboard = () => {
    const { currency } = useApp();
    const [greeting, setGreeting] = useState('');
    const { user } = useAuth();

    // Get greeting based on time of day
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) {
            setGreeting('Good Morning');
        } else if (hour < 18) {
            setGreeting('Good Afternoon');
        } else {
            setGreeting('Good Evening');
        }
    }, []);

    // Current day data
    const todayData = {
        visits: '14,209',
        sales: `${currency} 21,349.29`
    };

    // Notifications
    const notifications = [
        {
            id: 1,
            type: 'warning',
            message: '5 products didn\'t publish to your Facebook page',
            action: 'View products',
            link: '/products/unpublished'
        },
        {
            id: 2,
            type: 'info',
            message: '7 orders have payments that need to be captured',
            action: 'View payments',
            link: '/orders/payments'
        },
        {
            id: 3,
            type: 'info',
            message: '50+ orders need to be fulfilled',
            action: 'View orders',
            link: '/orders/pending'
        }
    ];

    // Weekly data for charts in stat cards
    const weeklyDataUsers = [
        { day: 'Mon', value: 24 },
        { day: 'Tue', value: 28 },
        { day: 'Wed', value: 30 },
        { day: 'Thu', value: 26 },
        { day: 'Fri', value: 22 },
        { day: 'Sat', value: 32 },
        { day: 'Sun', value: 26 }
    ];

    const weeklyDataIncome = [
        { day: 'Mon', value: 5400 },
        { day: 'Tue', value: 4800 },
        { day: 'Wed', value: 5200 },
        { day: 'Thu', value: 6100 },
        { day: 'Fri', value: 7200 },
        { day: 'Sat', value: 6800 },
        { day: 'Sun', value: 6200 }
    ];

    const weeklyDataConversion = [
        { day: 'Mon', value: 2.1 },
        { day: 'Tue', value: 1.9 },
        { day: 'Wed', value: 2.3 },
        { day: 'Thu', value: 2.4 },
        { day: 'Fri', value: 2.7 },
        { day: 'Sat', value: 3.1 },
        { day: 'Sun', value: 2.8 }
    ];

    const monthlyDataSessions = [
        { month: 'Jan', value: 42 },
        { month: 'Feb', value: 38 },
        { month: 'Mar', value: 46 },
        { month: 'Apr', value: 52 },
        { month: 'May', value: 48 },
        { month: 'Jun', value: 41 },
        { month: 'Jul', value: 45 },
        { month: 'Aug', value: 49 },
        { month: 'Sep', value: 53 },
        { month: 'Oct', value: 47 },
        { month: 'Nov', value: 44 },
        { month: 'Dec', value: 50 }
    ];

    // Stats cards data
    const stats = [
        {
            id: 1,
            title: 'Users',
            value: '26K',
            change: '-12.4%',
            trend: 'down',
            icon: Users,
            color: 'from-indigo-400 to-indigo-600',
            bgColor: 'bg-indigo-500',
            data: weeklyDataUsers,
            chartType: 'line'
        },
        {
            id: 2,
            title: 'Income',
            value: `${currency} 6,200`,
            change: '+40.9%',
            trend: 'up',
            icon: CreditCard,
            color: 'from-blue-400 to-blue-600',
            bgColor: 'bg-blue-500',
            data: weeklyDataIncome,
            chartType: 'line'
        },
        {
            id: 3,
            title: 'Conversion Rate',
            value: '2.49%',
            change: '+84.7%',
            trend: 'up',
            icon: BarChart3,
            color: 'from-amber-400 to-amber-600',
            bgColor: 'bg-amber-500',
            data: weeklyDataConversion,
            chartType: 'line'
        },
        {
            id: 4,
            title: 'Sessions',
            value: '44K',
            change: '-23.6%',
            trend: 'down',
            icon: LineChart,
            color: 'from-red-400 to-red-600',
            bgColor: 'bg-red-500',
            data: monthlyDataSessions,
            chartType: 'bar'
        },
    ];

    // Traffic data for bar chart
    const trafficData = [
        { name: 'Monday', new: 120, existing: 240 },
        { name: 'Tuesday', new: 145, existing: 210 },
        { name: 'Wednesday', new: 162, existing: 253 },
        { name: 'Thursday', new: 134, existing: 226 },
        { name: 'Friday', new: 178, existing: 289 },
        { name: 'Saturday', new: 196, existing: 324 },
        { name: 'Sunday', new: 154, existing: 246 },
    ];

    // Brand data for pie chart
    const brandData = [
        { name: 'Nike', value: 35 },
        { name: 'Adidas', value: 28 },
        { name: 'Puma', value: 18 },
        { name: 'Reebok', value: 12 },
        { name: 'Under Armor', value: 7 },
    ];

    const BRAND_COLORS = ['#4F46E5', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

    // Recent orders data
    const recentOrders = [
        { id: '#ORD-7845', date: '2025-05-18', customer: 'John Doe', status: 'Delivered', amount: `${currency} 156.00` },
        { id: '#ORD-7844', date: '2025-05-18', customer: 'Jane Smith', status: 'Processing', amount: `${currency} 325.50` },
        { id: '#ORD-7843', date: '2025-05-17', customer: 'Robert Brown', status: 'Shipped', amount: `${currency} 243.75` },
        { id: '#ORD-7842', date: '2025-05-17', customer: 'Lisa Wong', status: 'Delivered', amount: `${currency} 189.25` },
        { id: '#ORD-7841', date: '2025-05-16', customer: 'Michael Chen', status: 'Pending', amount: `${currency} 548.00` },
    ];

    // Top products data
    const topProducts = [
        { id: 1, name: 'Wireless Headphones', image: '/products/headphones.jpg', sales: 145, revenue: `${currency} 12,325.00` },
        { id: 2, name: 'Smartphone Case', image: '/products/case.jpg', sales: 232, revenue: `${currency} 5,568.00` },
        { id: 3, name: 'Smart Watch', image: '/products/watch.jpg', sales: 65, revenue: `${currency} 19,435.00` },
        { id: 4, name: 'USB-C Cable', image: '/products/cable.jpg', sales: 189, revenue: `${currency} 2,835.00` },
        { id: 5, name: 'Bluetooth Speaker', image: '/products/speaker.jpg', sales: 72, revenue: `${currency} 7,920.00` },
    ];

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Delivered':
                return 'bg-green-100 text-green-800';
            case 'Shipped':
                return 'bg-blue-100 text-blue-800';
            case 'Processing':
                return 'bg-yellow-100 text-yellow-800';
            case 'Pending':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getNotificationStyles = (type) => {
        switch (type) {
            case 'warning':
                return 'bg-amber-100/10 border-amber-400 text-amber-400';
            case 'info':
                return 'bg-blue-100/10 border-blue-400 text-blue-400';
            case 'error':
                return 'bg-red-100/10 border-red-400 text-red-400';
            default:
                return 'bg-gray-100/10 border-gray-400 text-gray-400';
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'warning':
                return <AlertCircle className="h-5 w-5" />;
            case 'info':
                return <AlertCircle className="h-5 w-5" />;
            case 'error':
                return <AlertCircle className="h-5 w-5" />;
            default:
                return <AlertCircle className="h-5 w-5" />;
        }
    };

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-bgdark p-3 border border-border rounded-lg shadow-lg backdrop-blur-sm">
                    <p className="font-medium text-primary">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="px-4 sm:px-6 py-6 space-y-6 max-w-full">
            <Breadcrumbs />
            <div className='bg-bgdark rounded-xl p-3 sm:p-6 border border-border shadow-xl flex flex-col gap-4'>
                {/* Top section with greeting and stats */}
                <div className="bg-bgdark p-3 sm:p-6">
                    <div className="flex flex-col justify-between items-start gap-4 sm:gap-8 md:gap-12">
                        <div>
                            <h1 className="text-2xl font-bold text-accent mb-1">
                                {greeting}, {user.name}!
                            </h1>
                            <p className="text-secondary">
                                Here's what happening with your store today
                            </p>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center">
                            <div className="text-center mr-8">
                                <p className="text-secondary text-sm">Today's visit</p>
                                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">{todayData.visits}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-secondary text-sm">Today's total sales</p>
                                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">{todayData.sales}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`border-l-4 rounded-lg p-4 flex items-center justify-between transition-all duration-200 ${getNotificationStyles(notification.type)}`}
                        >
                            <div className="flex items-center">
                                {getNotificationIcon(notification.type)}
                                <span className="ml-3 mr-1 text-primary">{notification.message}</span>
                            </div>
                            <a
                                href={notification.link}
                                className="flex items-center text-primary text-xs sm:text-sm md:text-base hover:text-blue-500 transition-colors duration-200 font-medium"
                            >
                                {notification.action}
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </a>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                    const IconComponent = stat.icon;
                    return (
                        <div
                            key={stat.id}
                            className="bg-bgdark rounded-xl p-6 border border-border shadow-xl transition-all duration-200 hover:shadow-2xl hover:border-accent group"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-sm font-medium text-secondary">{stat.title}</h3>
                                    <div className="mt-2 flex items-baseline">
                                        <p className="text-2xl font-semibold text-primary">{stat.value}</p>
                                        <span
                                            className={`ml-2 text-sm font-medium flex items-center ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                                                }`}
                                        >
                                            {stat.trend === 'up' ? (
                                                <TrendingUp className="h-3 w-3 mr-1" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3 mr-1" />
                                            )}
                                            {stat.change}
                                        </span>
                                    </div>
                                </div>
                                <div className={`${stat.bgColor} p-3 rounded-lg text-primary shadow-md`}>
                                    <IconComponent className="h-5 w-5" />
                                </div>
                            </div>

                            {/* Mini chart */}
                            <div className="mt-4 h-16">
                                <ResponsiveContainer width="100%" height="100%">
                                    {stat.chartType === 'line' ? (
                                        <RechartsLineChart
                                            data={stat.data}
                                            margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                                        >
                                            <Tooltip content={<CustomTooltip />} />
                                            <Line
                                                type="monotone"
                                                dataKey="value"
                                                stroke={stat.trend === 'up' ? '#10B981' : '#EF4444'}
                                                strokeWidth={2}
                                                dot={false}
                                                activeDot={{ r: 4, fill: stat.trend === 'up' ? '#10B981' : '#EF4444' }}
                                            />
                                        </RechartsLineChart>
                                    ) : (
                                        <BarChart
                                            data={stat.data}
                                            margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                                        >
                                            <Tooltip
                                                content={<CustomTooltip />}
                                                cursor={{ fill: 'rgba(55, 65, 81, 0.3)' }}
                                            />
                                            <Bar
                                                dataKey="value"
                                                fill={stat.trend === 'up' ? '#10B981' : '#EF4444'}
                                                radius={[2, 2, 0, 0]}
                                            />
                                        </BarChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Traffic Bar Chart */}
                <div className="bg-bgdark rounded-xl p-4 sm:p-6 border border-border shadow-xl lg:col-span-2">
                    <h2 className="text-lg font-medium text-primary mb-4">Traffic Overview</h2>
                    <div className="overflow-x-auto">
                        <div className="h-80 min-w-[600px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={trafficData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#6B7280"
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis
                                        stroke="#6B7280"
                                        tick={{ fontSize: 12 }}
                                    />
                                    <Tooltip
                                        content={<CustomTooltip />}
                                        cursor={{ fill: 'rgba(55, 65, 81, 0.3)' }}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="new"
                                        name="New Users"
                                        fill="#3B82F6"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="existing"
                                        name="Existing Users"
                                        fill="#10B981"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Brands Pie Chart */}
                <div className="bg-bgdark rounded-xl p-6 border border-border shadow-xl">
                    <h2 className="text-lg font-medium text-primary mb-4">Top Brands</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={brandData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {brandData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {brandData.map((brand, index) => (
                            <div key={brand.name} className="flex items-center">
                                <div
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: BRAND_COLORS[index % BRAND_COLORS.length] }}
                                ></div>
                                <span className="text-sm text-secondary">{brand.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent orders */}
                <div className="bg-bgdark rounded-xl overflow-hidden shadow-xl border border-border">
                    <div className="px-6 py-4 flex justify-between items-center">
                        <h2 className="text-lg font-medium text-primary">Recent Orders</h2>
                        <a href="/orders" className="text-blue-500 hover:text-blue-600 flex items-center text-sm font-medium">
                            View All <ExternalLink className="ml-1 h-4 w-4" />
                        </a>
                    </div>
                    <div className="px-6 py-4">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700/20">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Order ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700/20">
                                    {recentOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-700/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">{order.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{order.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{order.customer}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyles(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{order.amount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Top selling products */}
                <div className="bg-bgdark rounded-xl overflow-hidden shadow-xl border border-border">
                    <div className="px-6 py-4 flex justify-between items-center">
                        <h2 className="text-lg font-medium text-primary">Top Selling Products</h2>
                        <a href="/products/top" className="text-blue-500 hover:text-blue-600 flex items-center text-sm font-medium">
                            View All <ExternalLink className="ml-1 h-4 w-4" />
                        </a>
                    </div>
                    <div className="px-6 py-4">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700/20">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Product</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Units Sold</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700/20">
                                    {topProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-700/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0 rounded-md overflow-hidden bg-gray-700/20">
                                                        <img
                                                            src="/api/placeholder/40/40"
                                                            alt={product.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-primary">{product.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{product.sales}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{product.revenue}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;