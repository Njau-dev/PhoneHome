import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Search, Package, Phone, Laptop, Headphones, Plus, ChevronLeft, ChevronRight, Trash2, Edit, ArrowUpDown } from 'lucide-react';
import Breadcrumbs from '../components/BreadCrumbs';
import Title from '../components/Title';
import ConfirmationModal from '../components/ConfirmationModal'; // Import the modal

const List = () => {
    const [list, setList] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [categories, setCategories] = useState([]);
    const [categoryStats, setCategoryStats] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [isLoading, setIsLoading] = useState(false);

    // Modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    const productsPerPage = 25;
    const { backendUrl, currency } = useApp();
    const { token } = useAuth();

    // Function to fetch all products
    const fetchList = async () => {
        if (!token) {
            return null;
        }

        try {
            setIsLoading(true);
            const response = await axios.get(backendUrl + '/products');

            if (response.data.data.products) {
                setList(response.data.data.products);
                setFilteredList(response.data.data.products);
                // Extract and count categories
                processCategories(response.data.data.products);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Error fetching products');
        } finally {
            setIsLoading(false);
        }
    };

    // Function to initiate product deletion
    const initiateDeleteProduct = (product) => {
        setProductToDelete(product);
        setShowDeleteModal(true);
    };

    // Function to confirm and delete a product
    const confirmDeleteProduct = async () => {
        if (!productToDelete) return;

        try {
            setIsLoading(true);
            const response = await axios.delete(backendUrl + '/products/' + productToDelete.id, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                toast.success('Product deleted successfully!');
                await fetchList();
            } else {
                toast.error(response.data || 'Failed to delete product');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Error deleting product');
        } finally {
            setIsLoading(false);
            setShowDeleteModal(false);
            setProductToDelete(null);
        }
    };

    // Function to cancel deletion
    const cancelDeleteProduct = () => {
        setShowDeleteModal(false);
        setProductToDelete(null);
    };

    // Function to extract categories and count products in each
    const processCategories = (products) => {
        const uniqueCategories = [...new Set(products.map(product => product.category))];
        setCategories(uniqueCategories);

        const stats = uniqueCategories.map(category => {
            const count = products.filter(product => product.category === category).length;
            let icon;

            if (category.toLowerCase().includes('phone')) {
                icon = Phone;
            } else if (category.toLowerCase().includes('laptop')) {
                icon = Laptop;
            } else if (category.toLowerCase().includes('audio')) {
                icon = Headphones;
            } else {
                icon = Package;
            }

            return {
                name: category,
                count,
                icon,
                color: getRandomGradient()
            };
        });

        setCategoryStats(stats);
    };

    // Helper function to generate random gradient colors
    const getRandomGradient = () => {
        const gradients = [
            'from-blue-400 to-indigo-600',
            'from-green-400 to-emerald-600',
            'from-purple-400 to-violet-600',
            'from-amber-400 to-orange-600',
            'from-red-400 to-rose-600',
            'from-teal-400 to-cyan-600'
        ];

        return gradients[Math.floor(Math.random() * gradients.length)];
    };

    // Function to handle search
    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);

        if (term.trim() === '') {
            setFilteredList(list);
        } else {
            const filtered = list.filter(product =>
                product.name.toLowerCase().includes(term) ||
                product.category.toLowerCase().includes(term)
            );
            setFilteredList(filtered);
        }
        setCurrentPage(1); // Reset to first page when searching
    };

    // Function to handle sorting
    const handleSort = (field) => {
        const direction = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);

        const sorted = [...filteredList].sort((a, b) => {
            if (field === 'price') {
                return direction === 'asc' ? a.price - b.price : b.price - a.price;
            } else {
                const valueA = (a[field] || '').toString().toLowerCase();
                const valueB = (b[field] || '').toString().toLowerCase();
                return direction === 'asc'
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            }
        });

        setFilteredList(sorted);
    };

    // Calculate pagination values
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredList.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(filteredList.length / productsPerPage);

    // Pagination controls
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    useEffect(() => {
        fetchList();
    }, []);

    // Sort indicator component
    const SortIndicator = ({ field }) => {
        if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 text-secondary opacity-50" />;
        return sortDirection === 'asc'
            ? <ArrowUpDown className="h-4 w-4 ml-1 text-accent" />
            : <ArrowUpDown className="h-4 w-4 ml-1 text-accent rotate-180" />;
    };

    return (
        <div className="px-4 sm:px-6 py-6 space-y-6 max-w-full">

            <Breadcrumbs />

            {/* Header with search and add button */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-[24px] sm:text-2xl"> <Title text1={'Product'} text2={'Management'} />
                </h1>

                <div className="relative w-full md:w-1/2">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-bgdark focus:border-accent focus:outline-none transition-colors duration-300"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-secondary" />
                </div>

                <Link to="/products/add" className="flex items-center gap-2 bg-accent hover:bg-bgdark hover:text-accent hover:border hover:border-accent text-bgdark font-medium py-2 px-4 rounded-xl transition-colors duration-300">
                    <Plus className="h-5 w-5" />
                    <span>Add Product</span>
                </Link>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {/* Total Products Card */}
                <div className="bg-bgdark rounded-xl p-4 sm:p-6 border border-border shadow-xl transition-all duration-200 hover:shadow-accent/5">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-medium text-secondary">Total Products</h3>
                            <div className="mt-2">
                                <p className="text-2xl font-semibold text-primary">{list.length}</p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-400 to-indigo-600 p-3 rounded-lg text-primary">
                            <Package className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                {/* Category Cards */}
                {categoryStats.slice(0, 4).map((stat, index) => {
                    const IconComponent = stat.icon;
                    return (
                        <div
                            key={index}
                            className="bg-bgdark rounded-xl p-6 border border-border shadow-xl transition-all duration-200 hover:shadow-accent/5"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-medium text-secondary truncate">{stat.name}</h3>
                                    <div className="mt-2">
                                        <p className="text-2xl font-semibold text-primary">{stat.count}</p>
                                    </div>
                                </div>
                                <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg text-primary`}>
                                    <IconComponent className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Product List */}
            <div className="bg-bgdark rounded-xl overflow-hidden shadow-xl border border-border">
                <div className="px-3 sm:px-6 py-4 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-primary">Products List</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-secondary">
                            Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredList.length)} of {filteredList.length}
                        </span>
                    </div>
                </div>

                <div className="px-3 sm:px-6 py-4">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/20">
                            <thead>
                                <tr className="bg-gray-700/5">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                                        Image
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                                        <div className="flex items-center">
                                            Name
                                            <SortIndicator field="name" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer" onClick={() => handleSort('category')}>
                                        <div className="flex items-center">
                                            Category
                                            <SortIndicator field="category" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer" onClick={() => handleSort('price')}>
                                        <div className="flex items-center">
                                            Price
                                            <SortIndicator field="price" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-secondary uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/20">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-secondary">
                                            Loading products...
                                        </td>
                                    </tr>
                                ) : currentProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-secondary">
                                            No products found.
                                        </td>
                                    </tr>
                                ) : (
                                    currentProducts.map((product, index) => (
                                        <tr key={index} className="hover:bg-gray-700/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <img
                                                    src={product.image_urls[0]}
                                                    alt={product.name}
                                                    className="w-12 h-12 object-cover rounded-md border border-border"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                                                {product.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-700/10 text-primary">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                                                {currency} {product.price.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right flex justify-center gap-2">
                                                <Link to={`/products/edit/${product.id}`} className="p-2 bg-blue-500/10 text-blue-500 rounded-md hover:bg-blue-500/20 transition-colors">
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => initiateDeleteProduct(product)}
                                                    className="p-2 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="px-6 py-3 flex items-center justify-between border-t border-gray-700/20">
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
                                Showing <span className="font-medium">{indexOfFirstProduct + 1}</span> to{' '}
                                <span className="font-medium">{Math.min(indexOfLastProduct, filteredList.length)}</span> of{' '}
                                <span className="font-medium">{filteredList.length}</span> results
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

                                {[...Array(Math.min(5, totalPages)).keys()]
                                    .map(i => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            // If we have 5 or fewer pages, show all
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            // If we're near the start
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            // If we're near the end
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            // We're in the middle
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={i}
                                                onClick={() => paginate(pageNum)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
                                                    ? 'bg-bgdark border-accent text-accent'
                                                    : 'bg-bgdark border-border text-primary hover:bg-gray-700/10'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

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
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={cancelDeleteProduct}
                onConfirm={confirmDeleteProduct}
                title="Delete Product"
                message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
                type="danger"
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
};

export default List;