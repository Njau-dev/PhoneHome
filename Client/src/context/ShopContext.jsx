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
    const currency = 'Ksh';
    const delivery_fee = 200;

    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(true);

    useEffect(() => {
        //fetching data from multiple endpoints
        
        const fetchProducts = async () => {
            try {
                const [phonesResponse, tabletsResponse, laptopsResponse, audioResponse] = await Promise.all([
                    axios.get('http://127.0.0.1:5000/phones'),
                    axios.get('http://127.0.0.1:5000/tablet'),
                    axios.get('http://127.0.0.1:5000/laptop'),
                    axios.get('http://127.0.0.1:5000/audio')
                ]);

                const fetchedProducts = {
                    phones: phonesResponse.data,
                    tablets: tabletsResponse.data,
                    laptops: laptopsResponse.data,
                    audio: audioResponse.data
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