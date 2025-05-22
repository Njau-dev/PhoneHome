import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
    Search,
    Users as UsersIcon,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Edit,
    Shield,
    ShieldCheck,
    ArrowUpDown,
    User,
} from 'lucide-react';
import Breadcrumbs from '../components/BreadCrumbs';
import Title from '../components/Title';
import ConfirmationModal from '../components/ConfirmationModal';

const Users = () => {
    const [usersList, setUsersList] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [roleStats, setRoleStats] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState('username');
    const [sortDirection, setSortDirection] = useState('asc');
    const [isLoading, setIsLoading] = useState(false);

    // Modal states
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'danger',
        onConfirm: null,
        confirmText: 'Confirm',
        cancelText: 'Cancel'
    });

    const usersPerPage = 25;
    const { backendUrl } = useApp();
    const { token } = useAuth();

    // Function to show modal
    const showModal = (config) => {
        setModalConfig({
            isOpen: true,
            ...config
        });
    };

    // Function to hide modal
    const hideModal = () => {
        setModalConfig(prev => ({
            ...prev,
            isOpen: false
        }));
    };

    // Function to fetch all users
    const fetchUsers = async () => {
        if (!token) {
            return null;
        }

        try {
            setIsLoading(true);
            const response = await axios.get(backendUrl + '/admin/users', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.data.users) {
                setUsersList(response.data.users);
                setFilteredUsers(response.data.users);
                // Extract and count roles
                processRoles(response.data.users);
            } else {
                toast.error(response.data.message || 'Failed to fetch users');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Error fetching users');
        } finally {
            setIsLoading(false);
        }
    };

    // Function to delete a user
    const removeUser = async (id) => {
        const user = usersList.find(u => u.id === id);

        showModal({
            title: 'Delete User',
            message: `Are you sure you want to delete "${user?.username}"? This action cannot be undone.`,
            type: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: async () => {
                try {
                    setIsLoading(true);
                    const response = await axios.delete(backendUrl + '/admin/user/' + id, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    if (response.status === 200) {
                        toast.success('User deleted successfully!');
                        await fetchUsers();
                    } else {
                        toast.error(response.data || 'Failed to delete user');
                    }
                } catch (error) {
                    console.error(error);
                    toast.error(error.message || 'Error deleting user');
                } finally {
                    setIsLoading(false);
                    hideModal();
                }
            }
        });
    };

    // Function to toggle user admin status
    const toggleAdminStatus = async (id, currentStatus) => {
        const user = usersList.find(u => u.id === id);
        const action = currentStatus ? 'remove admin privileges from' : 'grant admin privileges to';

        showModal({
            title: currentStatus ? 'Remove Admin Privileges' : 'Grant Admin Privileges',
            message: `Are you sure you want to ${action} "${user?.username}"?`,
            type: 'warning',
            confirmText: currentStatus ? 'Remove Privileges' : 'Grant Privileges',
            cancelText: 'Cancel',
            onConfirm: async () => {
                try {
                    setIsLoading(true);
                    const response = await axios.patch(
                        backendUrl + '/user/' + id + '/admin',
                        { is_admin: !currentStatus },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    );

                    if (response.status === 200) {
                        toast.success(`Admin privileges ${currentStatus ? 'removed' : 'granted'} successfully!`);
                        await fetchUsers();
                    } else {
                        toast.error(response.data || 'Failed to update user status');
                    }
                } catch (error) {
                    console.error(error);
                    toast.error(error.message || 'Error updating user status');
                } finally {
                    setIsLoading(false);
                    hideModal();
                }
            }
        });
    };

    // Function to extract roles and count users in each
    const processRoles = (users) => {
        // Count users by role
        const adminCount = users.filter(user => user.is_admin).length;
        const customerCount = users.filter(user => !user.is_admin).length;

        const stats = [
            {
                name: 'Admins',
                count: adminCount,
                icon: ShieldCheck,
                color: 'from-purple-400 to-violet-600'
            },
            {
                name: 'Customers',
                count: customerCount,
                icon: User,
                color: 'from-blue-400 to-indigo-600'
            }
        ];

        setRoleStats(stats);
    };

    // Function to handle search
    const handleSearch = (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);

        if (term.trim() === '') {
            setFilteredUsers(usersList);
        } else {
            const filtered = usersList.filter(user =>
                user.username.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term) ||
                (user.phone_number && user.phone_number.toLowerCase().includes(term))
            );
            setFilteredUsers(filtered);
        }
        setCurrentPage(1); // Reset to first page when searching
    };

    // Function to handle sorting
    const handleSort = (field) => {
        const direction = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);

        const sorted = [...filteredUsers].sort((a, b) => {
            const valueA = (a[field] || '').toString().toLowerCase();
            const valueB = (b[field] || '').toString().toLowerCase();
            return direction === 'asc'
                ? valueA.localeCompare(valueB)
                : valueB.localeCompare(valueA);
        });

        setFilteredUsers(sorted);
    };

    // Calculate pagination values
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    // Pagination controls
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    useEffect(() => {
        fetchUsers();
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
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={hideModal}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                confirmText={modalConfig.confirmText}
                cancelText={modalConfig.cancelText}
            />

            <Breadcrumbs />

            {/* Header with search and add button */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-[24px] sm:text-2xl">
                    <Title text1={'User'} text2={'Management'} />
                </h1>

                <div className="relative w-full md:w-1/2">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-bgdark focus:border-accent focus:outline-none transition-colors duration-300"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-secondary" />
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Total Users Card */}
                <div className="bg-bgdark rounded-xl p-4 sm:p-6 border border-border shadow-xl transition-all duration-200 hover:shadow-accent/5">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-medium text-secondary">Total Users</h3>
                            <div className="mt-2">
                                <p className="text-2xl font-semibold text-primary">{usersList.length}</p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-3 rounded-lg text-primary">
                            <UsersIcon className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                {/* Role Cards */}
                {roleStats.map((stat, index) => {
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

            {/* Users List */}
            <div className="bg-bgdark rounded-xl overflow-hidden shadow-xl border border-border">
                <div className="px-3 sm:px-6 py-4 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-primary">Users List</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-secondary">
                            Showing {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length}
                        </span>
                    </div>
                </div>

                <div className="px-3 sm:px-6 py-4">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/20">
                            <thead>
                                <tr className="bg-gray-700/5">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                                        Avatar
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer" onClick={() => handleSort('username')}>
                                        <div className="flex items-center">
                                            Username
                                            <SortIndicator field="username" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider cursor-pointer" onClick={() => handleSort('email')}>
                                        <div className="flex items-center">
                                            Email
                                            <SortIndicator field="email" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                                        Phone
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-secondary uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/20">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-secondary">
                                            Loading users...
                                        </td>
                                    </tr>
                                ) : currentUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-secondary">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    currentUsers.map((user, index) => (
                                        <tr key={index} className="hover:bg-gray-700/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {user.avatar_url ? (
                                                    <img
                                                        src={user.avatar_url}
                                                        alt={user.username}
                                                        className="w-10 h-10 object-cover rounded-full border border-border"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700/10 text-primary border border-border">
                                                        <User className="h-5 w-5" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                                                {user.username}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                                                {user.phone_number || "-"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_admin
                                                    ? "bg-purple-500/10 text-purple-500"
                                                    : "bg-blue-500/10 text-blue-500"
                                                    }`}>
                                                    {user.is_admin ? "Admin" : "Customer"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right flex justify-center gap-2">
                                                <Link to={`/users/edit/${user.id}`} className={`${user.is_admin
                                                    ? "hidden" : "p-2 bg-blue-500/10 text-blue-500 rounded-md hover:bg-blue-500/20 transition-colors"}`}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                                                    className={`p-2 rounded-md transition-colors ${user.is_admin
                                                        ? "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
                                                        : "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
                                                        }`}
                                                >
                                                    <Shield className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => removeUser(user.id)}
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
                                Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to{' '}
                                <span className="font-medium">{Math.min(indexOfLastUser, filteredUsers.length)}</span> of{' '}
                                <span className="font-medium">{filteredUsers.length}</span> results
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
        </div>
    );
};

export default Users;