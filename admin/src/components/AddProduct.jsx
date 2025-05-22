import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // Add this import
import { Upload, Plus, Star, ListChecks, Pencil, Smartphone, Laptop, Headphones, Package, Info, ChevronDown, Image, Building2, Settings, Trash2 } from 'lucide-react';
import Title from './Title';
import Breadcrumbs from './BreadCrumbs';
import FormField from './form/FormField';
import TextInput from './form/TextInput';

const Add = () => {
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedCategoryName, setSelectedCategoryName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { backendUrl } = useApp();
    const { token } = useAuth();
    const navigate = useNavigate(); // Add this hook

    // State to hold images
    const [images, setImages] = useState([null, null, null, null]);

    // Basic Inputs
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [type, setType] = useState('');
    const [isBestSeller, setIsBestSeller] = useState(false);
    const [hasVariation, setHasVariation] = useState(false);

    // Type-Specific Inputs
    const [ram, setRam] = useState('');
    const [storage, setStorage] = useState('');
    const [battery, setBattery] = useState('');
    const [mainCamera, setMainCamera] = useState('');
    const [frontCamera, setFrontCamera] = useState('');
    const [display, setDisplay] = useState('');
    const [processor, setProcessor] = useState('');
    const [os, setOs] = useState('');
    const [connectivity, setConnectivity] = useState('');
    const [colors, setColors] = useState('');

    const [variations, setVariations] = useState([]);
    const [currentVariation, setCurrentVariation] = useState({ ram: '', storage: '', price: '' });
    const [activeSection, setActiveSection] = useState('basic'); // To control accordion sections

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(backendUrl + '/categories');
                setCategories(response.data.categories);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        const fetchBrands = async () => {
            try {
                // Fetch brands based on selected category or all brands
                const url = selectedCategory
                    ? `${backendUrl}/brands?category=${selectedCategory}`
                    : `${backendUrl}/brands`;
                const response = await axios.get(url);
                setBrands(response.data);
            } catch (error) {
                console.error('Error fetching brands:', error);
            }
        };

        fetchCategories();
        fetchBrands();
    }, [backendUrl, selectedCategory]); // Add selectedCategory as dependency

    const handleCategoryChange = (e) => {
        const categoryId = e.target.value;
        setSelectedCategory(categoryId);
        setSelectedBrand(''); // Reset brand selection when category changes

        // Find the category name corresponding to the selected ID
        const category = categories.find((cat) => cat.id === parseInt(categoryId));
        setSelectedCategoryName(category ? category.name : '');
    };

    const handleImageChange = (e, index) => {
        const newImages = [...images];
        newImages[index] = e.target.files[0];
        setImages(newImages);
    };

    const handleCurrentVariationChange = (field, value) => {
        setCurrentVariation({
            ...currentVariation,
            [field]: value,
        });
    };

    const addVariation = () => {
        if (!currentVariation.ram || !currentVariation.storage || !currentVariation.price) {
            toast.warning('Please fill out all fields for the variation.');
            return;
        }

        setVariations((prev) => [...prev, currentVariation]);
        setCurrentVariation({ ram: '', storage: '', price: '' });
    };

    const removeVariation = (index) => {
        const newVariations = variations.filter((_, i) => i !== index);
        setVariations(newVariations);
    };

    const toggleSection = (section) => {
        setActiveSection(activeSection === section ? '' : section);
    };

    const getCategoryIcon = () => {
        if (selectedCategoryName.toLowerCase().includes('phone')) return <Smartphone className="w-5 h-5" />;
        if (selectedCategoryName.toLowerCase().includes('tablet')) return <Smartphone className="w-5 h-5" />;
        if (selectedCategoryName.toLowerCase().includes('laptop')) return <Laptop className="w-5 h-5" />;
        if (selectedCategoryName.toLowerCase().includes('audio')) return <Headphones className="w-5 h-5" />;
        return <Package className="w-5 h-5" />;
    };

    const resetForm = () => {
        // Reset images
        setImages([null, null, null, null]);

        // Reset basic inputs
        setName('');
        setDescription('');
        setPrice('');
        setType('');
        setIsBestSeller(false);
        setHasVariation(false);

        // Reset category and brand
        setSelectedCategory('');
        setSelectedBrand('');
        setSelectedCategoryName('');

        // Reset specifications
        setRam('');
        setStorage('');
        setBattery('');
        setMainCamera('');
        setFrontCamera('');
        setDisplay('');
        setProcessor('');
        setOs('');
        setConnectivity('');
        setColors('');

        // Reset variations
        setVariations([]);
        setCurrentVariation({ ram: '', storage: '', price: '' });

        // Reset active section
        setActiveSection('basic');
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);


        try {
            const formData = new FormData();

            // Append images
            images.forEach((image) => {
                if (image) {
                    formData.append(`image_urls`, image);
                }
            });

            // Append basic inputs
            formData.append('name', name);
            formData.append('description', description);
            formData.append('price', price);
            formData.append('category_id', selectedCategory);
            formData.append('brand_id', selectedBrand);
            formData.append('type', type);
            formData.append('isBestSeller', isBestSeller);
            formData.append('hasVariation', hasVariation);

            // Append type-specific inputs
            if (ram) formData.append('ram', ram);
            if (storage) formData.append('storage', storage);
            if (battery) formData.append('battery', battery);
            if (mainCamera) formData.append('main_camera', mainCamera);
            if (frontCamera) formData.append('front_camera', frontCamera);
            if (display) formData.append('display', display);
            if (processor) formData.append('processor', processor);
            if (os) formData.append('os', os);
            if (connectivity) formData.append('connectivity', connectivity);
            if (colors) formData.append('colors', colors);

            // Convert variations array to JSON and append it
            if (hasVariation && variations.length > 0) {
                formData.append('variations', JSON.stringify(variations));
            }

            // Send the formData to the backend
            const response = await axios.post(`${backendUrl}/products`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 201) {
                toast.success('Product added successfully!');
                resetForm();
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('Failed to add product. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="px-4 sm:px-6 py-6 space-y-6 max-w-6xl mx-auto">
            <Breadcrumbs />
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-primary"><Title text1={'ADD'} text2={'PRODUCT'} /></h1>

                {/* Manage Brands Button */}
                <button
                    type="button"
                    onClick={() => navigate('/products/brand-management')}
                    className="flex items-center gap-2 bg-bgdark hover:bg-accent hover:text-bgdark border border-accent text-accent font-medium py-2 px-4 rounded-xl transition-colors duration-300"
                >
                    <Building2 className="w-4 h-4" />
                    <span>Manage Brands</span>
                </button>
            </div>

            <form onSubmit={onSubmitHandler} className="space-y-8">
                {/* Image Upload Section */}
                <div className="bg-bgdark rounded-xl p-4 md:p-6 border border-border shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                        <Image className="w-5 h-5 text-accent" />
                        <h2 className="text-lg font-medium text-primary">Product Images</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((image, index) => (
                            <label
                                key={index}
                                htmlFor={`image${index + 1}`}
                                className="relative group cursor-pointer"
                            >
                                {image ? (
                                    <div className="relative aspect-square rounded-lg overflow-hidden border border-border group-hover:border-accent transition-colors duration-200">
                                        <img
                                            src={URL.createObjectURL(image)}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <Upload className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="aspect-square flex flex-col items-center justify-center bg-bgdark border border-border rounded-lg group-hover:border-accent transition-colors duration-200">
                                        <Upload className="w-8 h-8 text-secondary group-hover:text-accent transition-colors duration-200" />
                                        <span className="text-xs text-secondary mt-2">Upload Image {index + 1}</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id={`image${index + 1}`}
                                    name="image_urls"
                                    hidden
                                    onChange={(e) => handleImageChange(e, index)}
                                />
                            </label>
                        ))}
                    </div>
                </div>

                {/* Basic Info Section */}
                <div className="bg-bgdark rounded-xl p-4 md:p-6 border border-border shadow-xl">
                    <button
                        type="button"
                        onClick={() => toggleSection('basic')}
                        className="w-full flex items-center justify-between mb-4"
                    >
                        <div className="flex items-center gap-2">
                            <Info className="w-5 h-5 text-accent" />
                            <h2 className="text-lg font-medium text-primary">Basic Information</h2>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-secondary transition-transform duration-200 ${activeSection === 'basic' ? 'transform rotate-180' : ''}`} />
                    </button>

                    {activeSection === 'basic' && (
                        <div className="space-y-4">
                            <FormField label="Product Name">
                                <TextInput
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter product name"
                                    name="name"
                                />
                            </FormField>

                            <FormField label="Product Description">
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    name="description"
                                    placeholder="Write detailed product description"
                                    rows="4"
                                    className="w-full px-4 py-2 rounded-xl border border-border bg-bgdark focus:border-accent focus:outline-none transition-colors duration-300"
                                />
                            </FormField>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <FormField label="Category">
                                    <div className="relative">
                                        <select
                                            name="category_id"
                                            value={selectedCategory}
                                            onChange={handleCategoryChange}
                                            className="w-full pl-10 pr-4 py-2 rounded-xl appearance-none border border-border bg-bgdark focus:border-accent focus:outline-none transition-colors duration-300"
                                        >
                                            <option value="">Select a Category</option>
                                            {categories.map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            {selectedCategoryName ? getCategoryIcon() : <Package className="w-5 h-5 text-secondary" />}
                                        </div>
                                    </div>
                                </FormField>

                                <FormField label="Brand">
                                    <div className="relative">
                                        <select
                                            name="brand_id"
                                            onChange={(e) => setSelectedBrand(e.target.value)}
                                            value={selectedBrand}
                                            disabled={!selectedCategory}
                                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-bgdark focus:border-accent focus:outline-none transition-colors duration-300 disabled:opacity-50"
                                        >
                                            <option value="">
                                                {selectedCategory ? 'Select a Brand' : 'Select Category First'}
                                            </option>
                                            {brands.map((brand) => (
                                                <option key={brand.id} value={brand.id}>
                                                    {brand.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <Building2 className="w-5 h-5 text-secondary" />
                                        </div>
                                    </div>
                                </FormField>

                                <FormField label="Product Type">
                                    <TextInput
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        placeholder="e.g., phone, tablet, laptop"
                                        name="type"
                                    />
                                </FormField>

                                <FormField label="Price">
                                    <TextInput
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="10,000"
                                        type="number"
                                        name="price"
                                    />
                                </FormField>
                            </div>

                            <div className="flex flex-wrap gap-6 mt-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-5 h-5 flex items-center justify-center rounded border ${isBestSeller ? 'bg-accent border-accent' : 'border-border'}`}>
                                        {isBestSeller && <Star className="w-3 h-3 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        name="isBestSeller"
                                        checked={isBestSeller}
                                        onChange={() => setIsBestSeller((prev) => !prev)}
                                        className="sr-only"
                                    />
                                    <span className="text-sm text-primary group-hover:text-accent transition-colors duration-200">
                                        Mark as Bestseller
                                    </span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-5 h-5 flex items-center justify-center rounded border ${hasVariation ? 'bg-accent border-accent' : 'border-border'}`}>
                                        {hasVariation && <ListChecks className="w-3 h-3 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        name="hasVariation"
                                        checked={hasVariation}
                                        onChange={() => setHasVariation((prev) => !prev)}
                                        className="sr-only"
                                    />
                                    <span className="text-sm text-primary group-hover:text-accent transition-colors duration-200">
                                        Product has variations
                                    </span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Specifications Section */}
                {(selectedCategoryName === "Phone" || selectedCategoryName === "Tablet" || selectedCategoryName === "Laptop" || selectedCategoryName === "Audio") && (
                    <div className="bg-bgdark rounded-xl p-6 border border-border shadow-xl">
                        <button
                            type="button"
                            onClick={() => toggleSection('specs')}
                            className="w-full flex items-center justify-between mb-4"
                        >
                            <div className="flex items-center gap-2">
                                <Pencil className="w-5 h-5 text-accent" />
                                <h2 className="text-lg font-medium text-primary">Product Specifications</h2>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-secondary transition-transform duration-200 ${activeSection === 'specs' ? 'transform rotate-180' : ''}`} />
                        </button>

                        {activeSection === 'specs' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(selectedCategoryName === "Phone" || selectedCategoryName === "Tablet" || selectedCategoryName === "Laptop") && (
                                    <>
                                        <FormField label="RAM">
                                            <TextInput
                                                value={ram}
                                                onChange={(e) => setRam(e.target.value)}
                                                placeholder="e.g., 8GB"
                                                name="ram"
                                            />
                                        </FormField>

                                        <FormField label="Storage">
                                            <TextInput
                                                value={storage}
                                                onChange={(e) => setStorage(e.target.value)}
                                                placeholder="e.g., 128GB"
                                                name="storage"
                                            />
                                        </FormField>
                                    </>
                                )}

                                {(selectedCategoryName === "Phone" || selectedCategoryName === "Tablet" || selectedCategoryName === "Laptop" || selectedCategoryName === "Audio") && (
                                    <FormField label="Battery">
                                        <TextInput
                                            value={battery}
                                            onChange={(e) => setBattery(e.target.value)}
                                            placeholder="e.g., 4000mAh"
                                            name="battery"
                                        />
                                    </FormField>
                                )}

                                {(selectedCategoryName === "Phone" || selectedCategoryName === "Tablet") && (
                                    <>
                                        <FormField label="Main Camera">
                                            <TextInput
                                                value={mainCamera}
                                                onChange={(e) => setMainCamera(e.target.value)}
                                                placeholder="e.g., 48 MP"
                                                name="main_camera"
                                            />
                                        </FormField>

                                        <FormField label="Front Camera">
                                            <TextInput
                                                value={frontCamera}
                                                onChange={(e) => setFrontCamera(e.target.value)}
                                                placeholder="e.g., 12 MP"
                                                name="front_camera"
                                            />
                                        </FormField>
                                    </>
                                )}

                                {(selectedCategoryName === "Phone" || selectedCategoryName === "Tablet" || selectedCategoryName === "Laptop") && (
                                    <>
                                        <FormField label="Display">
                                            <TextInput
                                                value={display}
                                                onChange={(e) => setDisplay(e.target.value)}
                                                placeholder="e.g., 6.5 inch AMOLED"
                                                name="display"
                                            />
                                        </FormField>

                                        <FormField label="Processor">
                                            <TextInput
                                                value={processor}
                                                onChange={(e) => setProcessor(e.target.value)}
                                                placeholder="e.g., Snapdragon 888"
                                                name="processor"
                                            />
                                        </FormField>

                                        <FormField label="Operating System (OS)">
                                            <TextInput
                                                value={os}
                                                onChange={(e) => setOs(e.target.value)}
                                                placeholder="e.g., Android 13, iOS 18"
                                                name="os"
                                            />
                                        </FormField>
                                    </>
                                )}

                                {(selectedCategoryName === "Phone" || selectedCategoryName === "Tablet") && (
                                    <>
                                        <FormField label="Connectivity">
                                            <TextInput
                                                value={connectivity}
                                                onChange={(e) => setConnectivity(e.target.value)}
                                                placeholder="e.g., Wi-Fi 6, 5G, Bluetooth 5.0"
                                                name="connectivity"
                                            />
                                        </FormField>

                                        <FormField label="Available Colors" className="md:col-span-2">
                                            <TextInput
                                                value={colors}
                                                onChange={(e) => setColors(e.target.value)}
                                                placeholder="e.g., Red, Blue, Green (comma separated)"
                                                name="colors"
                                            />
                                        </FormField>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Variations Section */}
                {hasVariation && (
                    <div className="bg-bgdark rounded-xl p-6 border border-border shadow-xl">
                        <button
                            type="button"
                            onClick={() => toggleSection('variations')}
                            className="w-full flex items-center justify-between mb-4"
                        >
                            <div className="flex items-center gap-2">
                                <ListChecks className="w-5 h-5 text-accent" />
                                <h2 className="text-lg font-medium text-primary">Product Variations</h2>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-secondary transition-transform duration-200 ${activeSection === 'variations' ? 'transform rotate-180' : ''}`} />
                        </button>

                        {activeSection === 'variations' && (
                            <div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <FormField label="RAM">
                                        <TextInput
                                            value={currentVariation.ram}
                                            onChange={(e) => handleCurrentVariationChange('ram', e.target.value)}
                                            placeholder="e.g., 8GB"
                                        />
                                    </FormField>

                                    <FormField label="Storage">
                                        <TextInput
                                            value={currentVariation.storage}
                                            onChange={(e) => handleCurrentVariationChange('storage', e.target.value)}
                                            placeholder="e.g., 128GB"
                                        />
                                    </FormField>

                                    <FormField label="Variation Price">
                                        <TextInput
                                            value={currentVariation.price}
                                            onChange={(e) => handleCurrentVariationChange('price', e.target.value)}
                                            placeholder="10,000"
                                            type="number"
                                        />
                                    </FormField>
                                </div>

                                <button
                                    type="button"
                                    onClick={addVariation}
                                    className="flex items-center gap-2 bg-bgdark hover:bg-accent hover:text-bgdark border border-accent text-accent font-medium py-2 px-4 rounded-xl transition-colors duration-300"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add Variation</span>
                                </button>

                                {variations.length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="text-sm font-medium text-primary mb-3">Added Variations:</h3>
                                        <div className="space-y-3">
                                            {variations.map((variation, index) => (
                                                <div
                                                    key={index}
                                                    className="flex flex-col sm:flex-row gap-2 items-center justify-between p-3 bg-gray-700/5 rounded-lg border border-border"
                                                >
                                                    <div className="flex-1 flex flex-col sm:flex-row gap-2">
                                                        <span className="px-2 py-1 bg-gray-700/10 rounded-md text-xs font-medium text-primary">
                                                            RAM: {variation.ram}
                                                        </span>
                                                        <span className="px-2 py-1 bg-gray-700/10 rounded-md text-xs font-medium text-primary">
                                                            Storage: {variation.storage}
                                                        </span>
                                                        <span className="px-2 py-1 bg-gray-700/10 rounded-md text-xs font-medium text-primary">
                                                            Price: {variation.price}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeVariation(index)}
                                                        className="p-1 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full font-medium py-3 px-6 rounded-xl transition-colors duration-300 
        ${isSubmitting
                            ? 'bg-accent/50 text-bgdark cursor-not-allowed'
                            : 'bg-accent hover:bg-bgdark hover:text-accent hover:border border-accent text-bgdark'
                        }`}
                >
                    {isSubmitting ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-bgdark border-t-transparent rounded-full animate-spin" />
                            <span>Adding Product...</span>
                        </div>
                    ) : (
                        'ADD PRODUCT'
                    )}
                </button>
            </form>
        </div>
    );
};

export default Add;