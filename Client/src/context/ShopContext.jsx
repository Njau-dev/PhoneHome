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

    useEffect(() => {
        //fetching all data

        const fetchProducts = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:5000/products');
                const allProducts = response.data.products;

                console.log(allProducts);


                // Filter products by category

                const fetchedProducts = {
                    phones: allProducts.filter(product => product.category === 'Test'),
                    tablets: allProducts.filter(product => product.category === 'Test 2'),
                    laptops: allProducts.filter(product => product.category === 'laptop'),
                    audio: allProducts.filter(product => product.category === 'audio')
                };

                console.log('Fetched products:', fetchedProducts);

                setProducts(fetchedProducts);

            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };

        fetchProducts();

    }, []);

    const value = {
        products, currency, delivery_fee,

        search, setSearch, showSearch, setShowSearch
    }

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider >
    )
}

export default ShopContextProvider