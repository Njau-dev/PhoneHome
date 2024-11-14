import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
    const [products, setProducts] = useState({
        phones: [],
        tablets: [],
        laptops: [],
        audio: []
    });

    const currency = 'Kshs';
    const delivery_fee = 300;

    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(true);
    const [cartItems, setCartItems] = useState({});
    const navigate = useNavigate();

    const addToCart = async (productId, selectedVariation = null, quantity = 1) => {
        const cartData = structuredClone(cartItems);

        // Flatten all products into a single array for easy searching
        const allProducts = [
            ...products.phones,
            ...products.tablets,
            ...products.laptops,
            ...products.audio
        ];

        // Search for the product by productId in the flattened list
        const productData = allProducts.find(product => Number(product.id) === Number(productId));
        // console.log('Found productData:', productData);

        // 🟩 **Highlight:** Directly use selectedVariation.price when variation is provided
        // const price = selectedVariation ? selectedVariation.price : products[productId]?.price;

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
            // 🟩 **Highlight:** Handle variations directly using variationKey and selected price
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
    };


    const getCartCount = () => {
        let count = 0;

        console.log(cartItems);

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

        console.log(count);

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
        cartItems, addToCart, setCartItems,
        getCartCount, getCartAmount,
        navigate
    };

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    );
}

export default ShopContextProvider;
