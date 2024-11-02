import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
    const [products, setProducts] = useState({
        phones: [],
        tablets: [],
        laptops: [],
        audio: []
    });

    const currency = 'Kshs';
    const delivery_fee = 200;

    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(true);
    const [cartItems, setCartItems] = useState({});

    // Helper function to check if a product requires a variation
    const productRequiresVariation = (productId) => {
        // Search through each category to find the product
        for (const category in products) {
            const product = products[category].find(p => p.id === productId);
            if (product) {
                return product.variations;
            }
        }
        return false; // Return false if product is not found
    };

    const generateVariationKey = (variation) => {
        return `${variation.ram}-${variation.storage}`;
    };

    const addToCart = async (productId, variation = null, quantity = 1) => {
        const cartData = structuredClone(cartItems);

        // Check if the product requires a variation, but none was selected
        if (!variation && productRequiresVariation(productId)) {
            console.log('Select product variation before adding to cart');
            return;
        }

        // Convert variation to a unique string key
        const variationKey = variation ? `${variation.ram}-${variation.storage}` : null;

        // Handle variations as unique keys under each product
        if (variationKey) {
            if (!cartData[productId]) {
                cartData[productId] = {};
            }
            cartData[productId][variationKey] = (cartData[productId][variationKey] || 0) + quantity;
        } else {
            cartData[productId] = (cartData[productId] || 0) + quantity;
        }

        setCartItems(cartData);
    };


    const getCartCount = () => {
        let totalCount = 0;

        for (const productId in cartItems) {
            const productData = cartItems[productId];

            if (typeof productData === 'object') { // Product with variations
                for (const variationKey in productData) {
                    totalCount += productData[variationKey] || 0;
                }
            } else { // Product without variations
                totalCount += productData;
            }
        }
        return totalCount;
    };


    useEffect(() => {
        console.log(cartItems);
    }, [cartItems])

    useEffect(() => {

        const fetchProducts = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:5000/products');
                const allProducts = response.data.products;

                // Filter products by category
                //change this code after adding categories

                const fetchedProducts = {
                    phones: allProducts.filter(product => product.category === 'Test'),
                    tablets: allProducts.filter(product => product.category === 'Test 2'),
                    laptops: allProducts.filter(product => product.category === 'Laptops'),
                    audio: allProducts.filter(product => product.category === 'Audio')
                };

                // console.log('Fetched products:', fetchedProducts);

                setProducts(fetchedProducts);

            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };

        fetchProducts();


    }, []);


    const value = {
        products, currency, delivery_fee,
        search, setSearch, showSearch, setShowSearch,
        cartItems, addToCart,
        getCartCount
    }

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider >
    )
}

export default ShopContextProvider