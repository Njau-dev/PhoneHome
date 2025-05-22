import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
    Plus,
    Package,
    Smartphone,
    Laptop,
    Headphones,
    Building2,
    Tag,
    Trash2,
    ChevronDown
} from 'lucide-react';
import Title from './Title';
import Breadcrumbs from './BreadCrumbs';
import FormField from './form/FormField';
import TextInput from './form/TextInput';

const BrandManagement = () => {
    const [categories, setCategories] = useState([]);
    const [brandsByCategory, setBrandsByCategory] = useState({});
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [brandName, setBrandName] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState('add');
    const { backendUrl } = useApp();
    const { token } = useAuth();

    useEffect(() => {
        fetchCategories();
        fetchBrandsByCategory();
    }, [backendUrl]);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(backendUrl + '/categories');
            setCategories(response.data.categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to fetch categories');
        }
    };

    const fetchBrandsByCategory = async () => {
        try {
            const response = await axios.get(backendUrl + '/brands');
            const brands = response.data;

            // Group brands by category (now each brand can have multiple categories)
            const grouped = {};

            brands.forEach(brand => {
                brand.categories.forEach(category => {
                    if (!grouped[category.id]) {
                        grouped[category.id] = [];
                    }
                    // Check if brand is already in this category group to avoid duplicates
                    if (!grouped[category.id].find(b => b.id === brand.id)) {
                        grouped[category.id].push(brand);
                    }
                });
            });

            setBrandsByCategory(grouped);
        } catch (error) {
            console.error('Error fetching brands:', error);
            toast.error('Failed to fetch brands');
        }
    };

    const getCategoryIcon = (categoryName) => {
        switch (categoryName.toLowerCase()) {
            case 'phone':
                return <Smartphone className="w-5 h-5" />;
            case 'tablet':
                return <Smartphone className="w-5 h-5" />;
            case 'laptop':
                return <Laptop className="w-5 h-5" />;
            case 'audio':
                return <Headphones className="w-5 h-5" />;
            default:
                return <Package className="w-5 h-5" />;
        }
    };

    const getCategoryColor = (categoryName) => {
        switch (categoryName.toLowerCase()) {
            case 'phone':
                return 'border-blue-500 bg-blue-500/10';
            case 'tablet':
                return 'border-green-500 bg-green-500/10';
            case 'laptop':
                return 'border-purple-500 bg-purple-500/10';
            case 'audio':
                return 'border-orange-500 bg-orange-500/10';
            default:
                return 'border-gray-500 bg-gray-500/10';
        }
    };

    const handleCategoryToggle = (categoryId) => {
        setSelectedCategories(prev => {
            if (prev.includes(categoryId)) {
                return prev.filter(id => id !== categoryId);
            } else {
                return [...prev, categoryId];
            }
        });
    };

    const handleAddBrand = async (e) => {
        e.preventDefault();

        if (!brandName.trim() || selectedCategories.length === 0) {
            toast.warning('Please fill in brand name and select at least one category');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${backendUrl}/brands`, {
                name: brandName.trim(),
                category_ids: selectedCategories
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 201) {
                toast.success('Brand added successfully!');
                setBrandName('');
                setSelectedCategories([]);
                fetchBrandsByCategory(); // Refresh the brands list
            }
        } catch (error) {
            console.error('Error adding brand:', error);
            if (error.response?.data?.Error) {
                toast.error(error.response.data.Error);
            } else {
                toast.error('Failed to add brand. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBrand = async (brandId) => {
        if (!window.confirm('Are you sure you want to delete this brand?')) {
            return;
        }

        try {
            await axios.delete(`${backendUrl}/brands/${brandId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            toast.success('Brand deleted successfully!');
            fetchBrandsByCategory(); // Refresh the brands list
        } catch (error) {
            console.error('Error deleting brand:', error);
            toast.error('Failed to delete brand');
        }
    };

    const toggleSection = (section) => {
        setActiveSection(activeSection === section ? '' : section);
    };

    return (
        <div className="px-4 sm:px-6 py-6 space-y-6 max-w-6xl mx-auto">
            <Breadcrumbs />
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-primary">
                    <Title text1={'BRAND'} text2={'MANAGEMENT'} />
                </h1>
            </div>

            {/* Add Brand Section */}
            <div className="bg-bgdark rounded-xl p-4 md:p-6 border border-border shadow-xl">
                <button
                    type="button"
                    onClick={() => toggleSection('add')}
                    className="w-full flex items-center justify-between mb-4"
                >
                    <div className="flex items-center gap-2">
                        <Plus className="w-5 h-5 text-accent" />
                        <h2 className="text-lg font-medium text-primary">Add New Brand</h2>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-secondary transition-transform duration-200 ${activeSection === 'add' ? 'transform rotate-180' : ''}`} />
                </button>

                {activeSection === 'add' && (
                    <form onSubmit={handleAddBrand} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label="Brand Name">
                                <TextInput
                                    value={brandName}
                                    onChange={(e) => setBrandName(e.target.value)}
                                    placeholder="Enter brand name (e.g., Samsung, Apple)"
                                    name="brandName"
                                />
                            </FormField>

                            <FormField label="Categories (Select Multiple)">
                                <div className="space-y-2">
                                    <p className="text-sm text-secondary mb-3">Select which categories this brand belongs to:</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {categories.map((category) => (
                                            <label
                                                key={category.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${selectedCategories.includes(category.id)
                                                        ? `${getCategoryColor(category.name)} border-accent`
                                                        : 'border-border hover:border-accent/50'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCategories.includes(category.id)}
                                                    onChange={() => handleCategoryToggle(category.id)}
                                                    className="sr-only"
                                                />
                                                <div className={`w-5 h-5 flex items-center justify-center rounded border ${selectedCategories.includes(category.id)
                                                        ? 'bg-accent border-accent'
                                                        : 'border-border'
                                                    }`}>
                                                    {selectedCategories.includes(category.id) && (
                                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                                    )}
                                                </div>
                                                {getCategoryIcon(category.name)}
                                                <span className="text-sm font-medium text-primary">
                                                    {category.name}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </FormField>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-accent hover:bg-bgdark hover:text-accent hover:border border-accent text-bgdark font-medium py-2 px-6 rounded-xl transition-colors duration-300 disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add Brand'}
                        </button>
                    </form>
                )}
            </div>

            {/* Brands by Category Section */}
            <div className="bg-bgdark rounded-xl p-4 md:p-6 border border-border shadow-xl">
                <button
                    type="button"
                    onClick={() => toggleSection('view')}
                    className="w-full flex items-center justify-between mb-4"
                >
                    <div className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-accent" />
                        <h2 className="text-lg font-medium text-primary">Brands by Category</h2>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-secondary transition-transform duration-200 ${activeSection === 'view' ? 'transform rotate-180' : ''}`} />
                </button>

                {activeSection === 'view' && (
                    <div className="space-y-6">
                        {categories.map((category) => {
                            const categoryBrands = brandsByCategory[category.id] || [];

                            return (
                                <div key={category.id} className="border border-border rounded-lg p-4">
                                    <div className={`flex items-center gap-3 mb-4 p-3 rounded-lg ${getCategoryColor(category.name)}`}>
                                        {getCategoryIcon(category.name)}
                                        <h3 className="text-lg font-medium text-primary">{category.name}</h3>
                                        <span className="ml-auto text-sm text-secondary bg-bgdark px-2 py-1 rounded-full">
                                            {categoryBrands.length} brand{categoryBrands.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>

                                    {categoryBrands.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {categoryBrands.map((brand) => (
                                                <div
                                                    key={brand.id}
                                                    className="flex items-center justify-between p-3 bg-gray-700/5 rounded-lg border border-border hover:border-accent transition-colors duration-200"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 text-secondary" />
                                                        <span className="text-sm font-medium text-primary">
                                                            {brand.name}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteBrand(brand.id)}
                                                        className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors duration-200"
                                                        title="Delete brand"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-secondary">
                                            <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p>No brands added for this category yet</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrandManagement;