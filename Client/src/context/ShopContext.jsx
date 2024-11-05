import axios from "axios";
import { createContext, useEffect, useState } from "react";

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

    // Helper to check if product requires a variation
    const productRequiresVariation = (productId) => {
        for (const category in products) {
            const product = products[category].find(p => p.id === productId);
            if (product) return product.variations || false;
        }
        return false;
    };

    const fetchProductDetails = async (productId) => {
        try {
            const response = await axios.get(`http://127.0.0.1:5000/product/${productId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching product details:", error);
            return null;
        }
    };

    // const generateVariationKey = (variation) => `${variation.ram}-${variation.storage}`;

    const addToCart = async (productId, selectedVariation = null, quantity = 1) => {
        const cartData = structuredClone(cartItems);

        // 🟩 **Highlight:** Directly use selectedVariation.price when variation is provided
        const price = selectedVariation ? selectedVariation.price : products[productId]?.price;

        console.log(price);

        // Ensure a product ID and price exist
        if (!productId || (selectedVariation && !price)) {
            console.error(`Required product or variation price not found for ID: ${productId}`);
            return;
        }

        // Variation key for uniquely identifying products with variations
        const variationKey = selectedVariation ? `${selectedVariation.ram}-${selectedVariation.storage}` : null;

        if (variationKey) {
            // 🟩 **Highlight:** Handle variations directly using variationKey and selected price
            if (!cartData[productId]) {
                cartData[productId] = {};
            }
            cartData[productId][variationKey] = {
                quantity: (cartData[productId][variationKey]?.quantity || 0) + quantity,
                price, // Assign price from selected variation
            };
        } else {
            // Non-variation product: add to cart with quantity and price
            console.log(productData.price);

            if (!cartData[productId]) {
                cartData[productId] = { quantity: 0, price };
            }
            cartData[productId].quantity += quantity;
        }

        setCartItems(cartData);
    };


    const getCartCount = () => {
        let totalCount = 0;
        for (const productId in cartItems) {
            const productData = cartItems[productId];
            if (typeof productData === 'object') {
                for (const variationKey in productData) {
                    totalCount += productData[variationKey]?.quantity || 0;
                }
            } else {
                totalCount += productData.quantity || 0;
            }
        }
        return totalCount;
    };

    useEffect(() => {
        console.log(cartItems);
    }, [cartItems]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:5000/products');
                const allProducts = response.data.products;

                const fetchedProducts = {
                    phones: allProducts.filter(product => product.category === 'Test'),
                    tablets: allProducts.filter(product => product.category === 'Test 2'),
                    laptops: allProducts.filter(product => product.category === 'Laptops'),
                    audio: allProducts.filter(product => product.category === 'Audio')
                };

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
    };

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    );
}

export default ShopContextProvider;
