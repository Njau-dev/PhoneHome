import { CloudArrowUpIcon } from '@heroicons/react/24/outline'
import React, { useEffect, useState } from 'react'
import { backendUrl } from '../App';
import axios from 'axios';
import { toast } from 'react-toastify';

const Add = ({ token }) => {
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(""); // Tracks the selected category
    const [selectedBrand, setSelectedBrand] = useState(""); // Holds the selected brand ID
    const [selectedCategoryName, setSelectedCategoryName] = useState("");


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

    // State to manage the current variation inputs
    const [currentVariation, setCurrentVariation] = useState({ ram: '', storage: '', price: '' });



    // Fetch categories and brands when the component mounts
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(backendUrl + '/categories');
                setCategories(response.data.categories);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        const fetchBrands = async () => {
            try {
                const response = await axios.get(backendUrl + '/brands');
                setBrands(response.data);
            } catch (error) {
                console.error("Error fetching brands:", error);
            }
        };

        fetchCategories();
        fetchBrands();
    }, []);


    const handleCategoryChange = (e) => {
        const categoryId = e.target.value;
        setSelectedCategory(categoryId);

        // Find the category name corresponding to the selected ID
        const category = categories.find((cat) => cat.id === parseInt(categoryId));
        setSelectedCategoryName(category ? category.name : "");
    };


    // Handle image change
    const handleImageChange = (e, index) => {
        const newImages = [...images];
        newImages[index] = e.target.files[0]; // Set the file at the specific index
        setImages(newImages);
    };

    // Handle input changes for the current variation
    const handleCurrentVariationChange = (field, value) => {
        setCurrentVariation({
            ...currentVariation,
            [field]: value, // Update the specific field in the current variation
        });
    };

    // Add the current variation to the variations list
    const addVariation = () => {
        // Prevent adding empty variations
        if (!currentVariation.ram || !currentVariation.storage || !currentVariation.price) {
            toast.warning("Please fill out all fields for the variation.");
            return;
        }

        setVariations((prev) => [...prev, currentVariation]); // Add new variation
        setCurrentVariation({ ram: '', storage: '', price: '' }); // Reset the input fields
    };

    // Remove a specific variation from the list
    const removeVariation = (index) => {
        const newVariations = variations.filter((_, i) => i !== index);
        setVariations(newVariations);
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();

        try {
            const formData = new FormData()

            // Append images
            images.forEach((image, index) => {
                if (image) {
                    formData.append(`image_urls`, image); // Append each image
                }
            });

            // Append basic inputs
            formData.append("name", name);
            formData.append("description", description);
            formData.append("price", price);
            formData.append("category_id", selectedCategory);
            formData.append("brand_id", selectedBrand);
            formData.append("type", type);
            formData.append("isBestSeller", isBestSeller);
            formData.append("hasVariation", hasVariation);

            // Append type-specific inputs
            if (ram) formData.append("ram", ram);
            if (storage) formData.append("storage", storage);
            if (battery) formData.append("battery", battery);
            if (mainCamera) formData.append("main_camera", mainCamera);
            if (frontCamera) formData.append("front_camera", frontCamera);
            if (display) formData.append("display", display);
            if (processor) formData.append("processor", processor);
            if (os) formData.append("os", os);
            if (connectivity) formData.append("connectivity", connectivity);
            if (colors) formData.append("colors", colors);

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

            console.log(response.data);

            if (response.status === 201) {
                toast.success('Product added successfully!');
            }

        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error('Failed to add product. Please try again.');
        }
    }

    return (
        <form onSubmit={onSubmitHandler} className='flex flex-col w-full lg:w-[60%] items-start gap-3'>
            {/* Image Upload */}
            <div>
                <p className='mb-3'>Upload Image</p>
                <div className='flex gap-2'>
                    {images.map((image, index) => (
                        <label key={index} htmlFor={`image${index + 1}`}>
                            {image ? (
                                <img
                                    src={URL.createObjectURL(image)} // Create preview URL for the image
                                    alt={`Preview ${index + 1}`}
                                    className='w-16 md:w-20 bg-bgdark p-2 border border-border rounded-lg object-cover cursor-pointer'
                                />
                            ) : (
                                <CloudArrowUpIcon className='w-16 md:w-20 bg-bgdark p-2 border border-border hover:border-accent cursor-pointer rounded-lg' />
                            )}
                            <input
                                type="file"
                                id={`image${index + 1}`}
                                name='image_urls'
                                hidden
                                onChange={(e) => handleImageChange(e, index)} // Update the image state for the respective index
                            />
                        </label>
                    ))}
                </div>
            </div>

            {/* Basic Inputs */}
            <div className='w-full'>
                <p className='mb-2'>Product Name</p>
                <input onChange={(e) => setName(e.target.value)} value={name} type="text" name='name' placeholder='Type here' className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300' />
            </div>

            <div className='w-full'>
                <p className='mb-2'>Product Description</p>
                <textarea onChange={(e) => setDescription(e.target.value)} value={description} name='description' placeholder='Write content here' className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300' />
            </div>

            {/* Category, Brand, Price */}
            <div className='flex flex-col sm:flex-row lg:my-4 gap-2 w-full sm:gap-8'>
                <div>
                    <p className='mb-2'>Category</p>
                    <select
                        name='category_id'
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        className='w-full px-3 py-2'>
                        <option>Select a Category</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <p className='mb-2'>Brand</p>
                    <select name='brand_id'
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        value={selectedBrand}
                        className='w-full px-3 py-2'>
                        <option value="">Select a Brand</option>
                        {brands.map((brand) => (
                            <option key={brand.id} value={brand.id}>
                                {brand.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <p className='mb-2'>Product Type</p>
                    <input
                        type="text"
                        name='type'
                        onChange={(e) => setType(e.target.value)} value={type}
                        placeholder='e.g., phone, tablet, laptop, audio'
                        className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300'
                    />
                </div>

                <div>
                    <p className='mb-2'>Price</p>
                    <input name='price' onChange={(e) => setPrice(e.target.value)} value={price} className='w-full sm:w-[120px] px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300' type="number" placeholder='10,000' />
                </div>
            </div>

            {/* Bestseller and Variations Checkboxes */}
            <div className='w-full flex items-center gap-4 mt-3'>
                <div className='w-full flex gap-4 items-center'>
                    <input type="checkbox" name='isBestSeller' checked={isBestSeller} onChange={() => setIsBestSeller(prev => !prev)} />
                    <p className='mb-2'>Bestseller</p>
                </div>
                <div className='w-full flex gap-4 items-center'>
                    <input type="checkbox" name='hasVariation' checked={hasVariation} onChange={() => setHasVariation(prev => !prev)} />
                    <p className='mb-2'>Variations</p>
                </div>
            </div>

            {/* Conditional Inputs */}
            {selectedCategoryName === "Phone" || selectedCategoryName === "Tablet" ? (
                <>
                    {/* Type-Specific Fields for Phone and Tablet */}
                    <div className='w-full'>
                        <p className='mb-2'>RAM</p>
                        <input type="text" name='ram' onChange={(e) => setRam(e.target.value)} value={ram} placeholder='e.g., 8GB' className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300' />
                    </div>
                    <div className='w-full'>
                        <p className='mb-2'>Storage</p>
                        <input type="text" name='storage' onChange={(e) => setStorage(e.target.value)} value={storage} placeholder='e.g., 128GB' className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300' />
                    </div>

                    <div className='w-full'>
                        <p className='mb-2'>Battery</p>
                        <input type="text" name='battery' onChange={(e) => setBattery(e.target.value)} value={battery} placeholder='e.g., 4000mAh' className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300' />
                    </div>

                    <div className='w-full'>
                        <p className='mb-2'>Main Camera</p>
                        <input type="text" name='main_camera' onChange={(e) => setMainCamera(e.target.value)} value={mainCamera} placeholder='e.g., 48 MP' className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300' />
                    </div>

                    <div className='w-full'>
                        <p className='mb-2'>Front Camera</p>
                        <input type="text" name='front_camera' onChange={(e) => setFrontCamera(e.target.value)} value={frontCamera} placeholder='e.g., 12 MP' className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300' />
                    </div>

                    <div className='w-full'>
                        <p className='mb-2'>Display</p>
                        <input type="text" name='display' onChange={(e) => setDisplay(e.target.value)} value={display} placeholder='e.g., 6.5 inch AMOLED' className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300' />
                    </div>

                    <div className='w-full'>
                        <p className='mb-2'>Processor</p>
                        <input type="text" name='processor' onChange={(e) => setProcessor(e.target.value)} value={processor} placeholder='e.g., Snapdragon 888' className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300' />
                    </div>

                    {/* Operating System (OS) */}
                    <div className='w-full'>
                        <p className='mb-2'>Operating System (OS)</p>
                        <input
                            type="text"
                            name='os' onChange={(e) => setOs(e.target.value)} value={os}
                            placeholder='e.g., Android 13, iOS 18, Windows 11'
                            className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300'
                        />
                    </div>

                    {/* Connectivity */}
                    <div className='w-full'>
                        <p className='mb-2'>Connectivity</p>
                        <input
                            type="text"
                            name='connectivity' onChange={(e) => setConnectivity(e.target.value)} value={connectivity}
                            placeholder='e.g., Wi-Fi 6, 5G, Bluetooth 5.0'
                            className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300'
                        />
                    </div>

                    {/* Colors */}
                    <div className='w-full'>
                        <p className='mb-2'>Available Colors</p>
                        <input
                            type="text"
                            name='colors' onChange={(e) => setColors(e.target.value)} value={colors}
                            placeholder='e.g., Red, Blue, Green (comma separated)'
                            className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300'
                        />
                    </div>

                    {/* Product Variations */}
                    <div className='w-full mt-4'>
                        <p className='mb-2'>Product Variations</p>
                        {/* Current Variation Input Fields */}
                        <div className='flex flex-col gap-2'>
                            <input
                                type="text"
                                placeholder='RAM (e.g., 8GB)'
                                value={currentVariation.ram}
                                onChange={(e) => handleCurrentVariationChange('ram', e.target.value)}
                                className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300'
                            />
                            <input
                                type="text"
                                placeholder='Storage (e.g., 128GB)'
                                value={currentVariation.storage}
                                onChange={(e) => handleCurrentVariationChange('storage', e.target.value)}
                                className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300'
                            />
                            <input
                                type="number"
                                placeholder='Variation Price'
                                value={currentVariation.price}
                                onChange={(e) => handleCurrentVariationChange('price', e.target.value)}
                                className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300'
                            />
                            <button type='button' onClick={addVariation} className='bg-accent hover:bg-bgdark hover:text-accent hover:border border-accent rounded text-bgdark text-base mt-8 mb-3 py-3 px-11'>Add Variation</button>
                        </div>
                        {/* List of Added Variations */}
                        <div className='mt-4'>
                            {variations.length > 0 && (
                                <>
                                    <p className='mb-2'>Added Variations:</p>
                                    {variations.map((variation, index) => (
                                        <div key={index} className='flex flex-col gap-2 lg:flex-row mb-2'>
                                            <p className='flex-1'>RAM: {variation.ram}</p>
                                            <p className='flex-1'>Storage: {variation.storage}</p>
                                            <p className='flex-1'>Price: {variation.price}</p>
                                            <button
                                                type="button"
                                                onClick={() => removeVariation(index)}
                                                className='px-3 py-1 bg-red-500 text-white rounded-lg'
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>

                </>
            ) : selectedCategoryName === "Laptop" ? (
                <>
                    {/* Type-Specific Fields for Laptop */}
                    <div className='w-full'>
                        <p className='mb-2'>RAM</p>
                        <input type="text" name='ram' onChange={(e) => setRam(e.target.value)} value={ram} placeholder='e.g., 16GB' className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300' />
                    </div>
                    <div className='w-full'>
                        <p className='mb-2'>Storage</p>
                        <input type="text" name='storage' onChange={(e) => setStorage(e.target.value)} value={storage} placeholder='e.g., 512GB SSD' className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300' />
                    </div>

                    <div className='w-full'>
                        <p className='mb-2'>Battery</p>
                        <input type="text" name='battery' onChange={(e) => setBattery(e.target.value)} value={battery} placeholder='e.g., 8 hours battery' className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300' />
                    </div>

                    <div className='w-full'>
                        <p className='mb-2'>Display</p>
                        <input type="text" name='display' onChange={(e) => setDisplay(e.target.value)} value={display} placeholder='e.g., 13 inch touch' className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300' />
                    </div>

                    <div className='w-full'>
                        <p className='mb-2'>Processor</p>
                        <input type="text" name='processor' onChange={(e) => setProcessor(e.target.value)} value={processor} placeholder='e.g., Intel i7' className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300' />
                    </div>

                    <div className='w-full'>
                        <p className='mb-2'>Operating System</p>
                        <input type="text" name='os' onChange={(e) => setOs(e.target.value)} value={os} placeholder='e.g., Windows 11' className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300' />
                    </div>
                </>
            ) : selectedCategoryName === "Audio" ? (
                <>
                    {/* Type-Specific Fields for Audio */}
                    <div className='w-full'>
                        <p className='mb-2'>Battery</p>
                        <input type="text" name='battery' onChange={(e) => setBattery(e.target.value)} value={battery} placeholder='e.g., 8 hours playtime' className='w-full px-3 py-2 placeholder:text-secondary focus:border-accent focus:outline-none transition-colors duration-300' />
                    </div>
                </>
            ) : null}

            <button type='submit' className='bg-accent  hover:bg-bgdark hover:text-accent hover:border border-accent rounded text-bgdark text-base mt-8 mb-3 py-3 px-11 w-full'>ADD</button>
        </form>
    );
};

export default Add;
