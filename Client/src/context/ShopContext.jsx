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


    const addToCart = async (productId, variation = null, quantity = 1) => {
        let cartData = structuredClone(cartItems);

        // Check if the product requires a variation, but none was selected
        if (variation === null && productRequiresVariation(productId)) {
            console.log("Please select a variation before adding to cart.");
            return;
        }

        // If product has variations, handle specific variation quantities
        if (variation) {
            if (!cartData[productId]) {
                cartData[productId] = {};
            }
            cartData[productId][variation] = (cartData[productId][variation] || 0) + quantity;
        }
        // For products without variations, update quantity by productId
        else {
            cartData[productId] = (cartData[productId] || 0) + quantity;
        }

        setCartItems(cartData);
    };



    useEffect(() => {

        const fetchProducts = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:5000/products');
                const allProducts = response.data.products;

                console.log(allProducts);


                // Filter products by category
                //change this code after adding categories

                const fetchedProducts = {
                    phones: allProducts.filter(product => product.category === 'Test'),
                    tablets: allProducts.filter(product => product.category === 'Test 2'),
                    laptops: allProducts.filter(product => product.category === 'Laptops'),
                    audio: allProducts.filter(product => product.category === 'Audio')
                };

                console.log('Fetched products:', fetchedProducts);

                setProducts(fetchedProducts);

            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };

        fetchProducts();


    }, []);

    useEffect(() => {
        console.log(cartItems);
    }, [cartItems])

    const value = {
        products, currency, delivery_fee,
        search, setSearch, showSearch, setShowSearch,
        cartItems, addToCart
    }

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider >
    )
}

export default ShopContextProvider