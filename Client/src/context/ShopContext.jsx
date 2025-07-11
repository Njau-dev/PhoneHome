import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useNotification } from "./NotificationContext";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
    const [products, setProducts] = useState({
        phones: [],
        tablets: [],
        laptops: [],
        audio: []
    });

    const { notifyCart, notifyWishlist, notifyCompare } = useNotification();

    const allProducts = [
        ...products.phones,
        ...products.tablets,
        ...products.laptops,
        ...products.audio
    ];

    const currency = 'Kshs';
    const delivery_fee = 0;
    const backendUrl = "https://cc7feeead81209.lhr.life";
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(true);
    const [cartItems, setCartItems] = useState({});
    const [token, setToken] = useState('');
    const [wishlistItems, setWishlistItems] = useState([]);
    const [compareItems, setCompareItems] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const addToCart = async (productId, selectedVariation = null, quantity = 1) => {
        const cartData = structuredClone(cartItems);

        const productData = allProducts.find(product => Number(product.id) === Number(productId));

        if (!productData) {
            console.error(`Product with ID ${productId} not found.`);
            return;
        }

        const price = selectedVariation ? selectedVariation.price : productData.price;

        // Ensure a product ID and price exist
        if (!productId || (selectedVariation && !price)) {
            console.error(`Required product or variation price not found for ID: ${productId}`);
            return;
        }

        // Variation key for uniquely identifying products with variations
        const variationKey = selectedVariation ? `${selectedVariation.ram} - ${selectedVariation.storage}` : null;

        if (variationKey) {
            //Handle variations directly using variationKey and selected price
            if (!cartData[productId]) {
                cartData[productId] = {};
            }
            cartData[productId][variationKey] = {
                quantity: (cartData[productId][variationKey]?.quantity || 0) + quantity,
                price,
            };
        } else {
            // Non-variation product: add to cart with quantity and price
            if (!cartData[productId]) {
                cartData[productId] = { quantity: 0, price };
            }
            cartData[productId].quantity += quantity;
        }

        setCartItems(cartData);

        if (token) {
            try {
                await axios.post(backendUrl + '/cart', { productId, selectedVariation, quantity }, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
            } catch (error) {
                console.log(error);
                toast.error(error.Message)
            }
        }
        // Show notification for cart addition
        notifyCart(`${productData.name} has been added to your cart.`, productData);
    };

    const getCartCount = () => {
        let count = 0;
        for (const productId in cartItems) {
            const item = cartItems[productId];

            // Check if `item` has nested properties, indicating variations
            const isVariationProduct = Object.keys(item).some(key =>
                typeof item[key] === 'object' && 'quantity' in item[key]
            );

            if (isVariationProduct) {
                // Product with variations
                for (const variationKey in item) {
                    const variation = item[variationKey];
                    if (typeof variation === 'object' && 'quantity' in variation) {
                        count += variation.quantity;
                    }
                }
            } else if (item && typeof item.quantity === 'number') {
                // Handle non-variation products
                count += item.quantity;
            }
        }

        return count;
    }

    const getCartAmount = () => {
        let totalAmount = 0;

        // Loop through each product in the cart
        for (const productId in cartItems) {
            const item = cartItems[productId];

            // Check if the product has variations
            const isVariationProduct = Object.keys(item).some(key =>
                typeof item[key] === 'object' && 'quantity' in item[key]
            );

            if (isVariationProduct) {
                // Handle products with variations
                for (const variationKey in item) {
                    const variation = item[variationKey];
                    if (typeof variation === 'object' && 'quantity' in variation) {
                        // Calculate subtotal for this variation
                        totalAmount += variation.price * variation.quantity;
                    }
                }
            } else if (item && typeof item.quantity === 'number') {
                // Handle regular products without variations
                totalAmount += item.price * item.quantity;
            }
        }

        return totalAmount;
    };

    useEffect(() => {
        // console.log(cartItems);
    }, [cartItems]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(backendUrl + '/products');
                const allProducts = response.data.products;

                if (!allProducts) {
                    return;
                }

                const fetchedProducts = {
                    phones: allProducts.filter(product => product.category === 'Phone'),
                    tablets: allProducts.filter(product => product.category === 'Tablet'),
                    laptops: allProducts.filter(product => product.category === 'Laptop'),
                    audio: allProducts.filter(product => product.category === 'Audio')
                };

                setProducts(fetchedProducts);
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };

        fetchProducts();
    }, []);


    const getUserCart = async (token) => {
        try {
            const response = await axios.get(`${backendUrl}/cart`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            setCartItems(response.data.cart);
            // console.log(response.data.cart);

        } catch (error) {
            console.error("Error fetching cart:", error);
            toast.error(error)
        }
    };

    const addToWishlist = async (productId) => {
        try {
            if (!token) {
                toast.info('Please login to add items to wishlist');
                // navigate('/login');
                return;
            }

            const productData = allProducts.find(product => Number(product.id) === Number(productId));

            const response = await axios.post(
                `${backendUrl}/wishlist`,
                { product_id: productId },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    }
                }
            );

            if (response.status === 200) {
                // Update local wishlist state
                setWishlistItems(prevItems => [...prevItems, response.data]);
                toast.success('Added to wishlist successfully');

                // Show notification for wishlist addition
                notifyWishlist(`${productData.name} has been added to your wishlist.`, productData);
            }

        } catch (error) {
            console.error('Error adding to wishlist:', error);
            toast.error(error.response?.data?.message || 'Failed to add to wishlist');
        }
    };

    // Function to fetch and set all compare items
    const fetchCompareItems = async () => {
        try {
            if (token) {
                const response = await axios.get(`${backendUrl}/compare`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const productIds = response.data.product_ids?.map(item => item.id) || [];
                const apiCompareItems = productIds
                    .map(id => allProducts.find(product => Number(product.id) === Number(id)))
                    .filter(Boolean);

                // Only update state if the items have changed
                if (JSON.stringify(compareItems) !== JSON.stringify(apiCompareItems)) {
                    setCompareItems(apiCompareItems);
                    localStorage.setItem('compareItems', JSON.stringify(apiCompareItems));
                }
            } else {
                const localCompare = JSON.parse(localStorage.getItem('compareItems')) || [];
                if (JSON.stringify(compareItems) !== JSON.stringify(localCompare)) {
                    setCompareItems(localCompare);
                }
            }
        } catch (error) {
            console.error('Error fetching compare items:', error);
            const localCompare = JSON.parse(localStorage.getItem('compareItems')) || [];
            if (JSON.stringify(compareItems) !== JSON.stringify(localCompare)) {
                setCompareItems(localCompare);
            }
            toast.error('Failed to sync compare items with your account');
        }
    };

    // Function to add product to compare
    const addToCompare = async (productId) => {
        await fetchCompareItems();
        try {
            // Check if compare limit is reached
            if (compareItems.length >= 3) {
                toast.info('Maximum of 3 products can be compared at once');
                return;
            }

            // Check if item is already in compare
            if (compareItems.some(item => item.id === productId)) {
                toast.info('Product is already in comparison list');
                return;
            }

            // Get the product details from allProducts
            const productToAdd = allProducts.find(product => Number(product.id) === Number(productId));

            if (!productToAdd) {
                toast.error('Product not found');
                return;
            }

            // Update local state first for immediate feedback
            const updatedCompareItems = [...compareItems, productToAdd];
            setCompareItems(updatedCompareItems);

            // Update localStorage
            localStorage.setItem('compareItems', JSON.stringify(updatedCompareItems));

            // If user is logged in, sync with backend
            if (token) {
                await axios.post(
                    `${backendUrl}/compare`,
                    { product_id: productId },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
            }

            toast.success('Added to comparison successfully');

            // Show notification for compare addition
            notifyCompare(`Compare count: ${compareItems.length + 1} /3`, productToAdd);
        } catch (error) {
            console.error('Error adding to compare:', error);
            toast.error('Failed to add product to comparison');

            // Rollback local state if API call fails and user is logged in
            if (token) {
                fetchCompareItems();
            }
        }
    };

    // Function to remove item from compare
    const removeFromCompare = async (productId) => {
        try {
            // Update local state first for immediate feedback
            const updatedCompareItems = compareItems.filter(item => item.id !== productId);
            setCompareItems(updatedCompareItems);

            // Update localStorage
            localStorage.setItem('compareItems', JSON.stringify(updatedCompareItems));

            // If user is logged in, sync with backend
            if (token) {
                await axios.delete(`${backendUrl}/compare/${productId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            }

            toast.success('Removed from comparison');
        } catch (error) {
            console.error('Error removing from compare:', error);
            toast.error('Failed to remove product from comparison');

            // Rollback local state if API call fails and user is logged in
            if (token) {
                fetchCompareItems();
            }
        }
    };

    // Format price helper function
    const formatPrice = (price) => {
        return price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ", ");
    };

    // Function to get all specifications for comparison
    const getCompareSpecifications = () => {
        return [
            { name: 'Name', key: 'name' },
            { name: 'Brand', key: 'brand' },
            { name: 'Category', key: 'category' },
            { name: 'Rating', key: 'rating' },
            { name: 'Price', key: 'price', format: (value) => `${currency} ${formatPrice(value)}` },
            { name: 'RAM', key: 'ram' },
            { name: 'Storage', key: 'storage' },
            { name: 'Processor', key: 'processor' },
            { name: 'Display', key: 'display' },
            { name: 'Main Camera', key: 'main_camera' },
            { name: 'Front Camera', key: 'front_camera' },
            { name: 'Operating System', key: 'os' },
            { name: 'Connectivity', key: 'connectivity' },
            { name: 'Colors', key: 'colors' },
            { name: 'Battery', key: 'battery' }
        ];
    };

    useEffect(() => {
        // Check for token in localStorage on initial load
        const storedToken = localStorage.getItem('token');
        if (storedToken && !token) {
            setToken(storedToken);
            setIsLoggedIn(true);
            getUserCart(storedToken);
            fetchCompareItems();
        } else {
            // If no token, still load compare items from localStorage
            const localCompare = JSON.parse(localStorage.getItem('compareItems')) || [];
            setCompareItems(localCompare);
        }
    }, []);

    // Effect to sync compareItems when token changes
    useEffect(() => {
        if (token) {
            fetchCompareItems();
            try {
                const userData = localStorage.getItem('user');
                // Parse the stored JSON string to an object
                const parsedUser = userData ? JSON.parse(userData) : null;
                setUser(parsedUser);
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('user');
                setUser(null);
            }
        }
    }, [token]);

    // Get product category
    const getProductCategory = (product) => {
        return product?.category || '';
    };

    // Get brand name
    const getBrandName = (product) => {
        return product?.brand || '';
    };


    const value = {
        products, currency, delivery_fee, user, setUser,
        search, setSearch, showSearch, setShowSearch,
        cartItems, addToCart, setCartItems,
        getCartCount, getCartAmount,
        navigate, backendUrl,
        token, setToken,
        getProductCategory, getBrandName,
        wishlistItems, addToWishlist,
        compareItems, addToCompare, removeFromCompare,
        fetchCompareItems, formatPrice, getCompareSpecifications
    };

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    );
}

export default ShopContextProvider;
