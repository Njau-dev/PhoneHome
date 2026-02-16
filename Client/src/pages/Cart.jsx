import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import CartTotal from '../components/CartTotal';
import axios from 'axios';
import Breadcrumbs from '../components/BreadCrumbs';

const Cart = () => {

  const { products, currency, cartItems, setCartItems, navigate, token, backendUrl } = useContext(ShopContext); 

  const flatProducts = [
    ...products.phones,
    ...products.tablets,
    ...products.laptops,
    ...products.audio
  ];

  const [cartData, setCartData] = useState([]);

  useEffect(() => {
    const tempData = [];

    for (const productId in cartItems) {
      const productData = cartItems[productId];

      // Check if the product is a variation product
      const isVariationProduct = typeof productData === 'object' && Object.keys(productData).some(key => {
        return typeof productData[key] === 'object' && 'quantity' in productData[key];
      });

      // Handling variation products
      if (isVariationProduct) {
        for (const variationKey in productData) {
          const variationData = productData[variationKey];

          // Check if the variation quantity is greater than 0
          if (variationData.quantity > 0) {
            tempData.push({
              id: productId,
              variation: variationKey,
              quantity: variationData.quantity,
              price: variationData.price,
              subtotal: variationData.price * variationData.quantity,
            });
          }
        }
      } else {
        // Handling non-variation products
        if (productData.quantity > 0) {
          tempData.push({
            id: productId,
            quantity: productData.quantity,
            price: productData.price,
            subtotal: productData.price * productData.quantity,
          });
        }
      }
    }

    setCartData(tempData);
  }, [cartItems]);

  useEffect(() => {
    // console.log("Cart Data:", cartData);
  }, [cartData]);

  const handleQuantityChange = async (id, variationKey, action) => {
    const updatedCartItems = { ...cartItems };

    // Check if it's a variation product
    if (variationKey && updatedCartItems[id][variationKey]) {
      const currentQuantity = updatedCartItems[id][variationKey].quantity;

      // Increase or decrease the quantity
      if (action === 'increase') {
        updatedCartItems[id][variationKey].quantity = currentQuantity + 1;
      } else if (action === 'decrease' && currentQuantity > 1) {
        updatedCartItems[id][variationKey].quantity = currentQuantity - 1;
      }

      // Update local cartData state
      const newCartData = cartData.map((item) => {
        if (item.id === id && item.variation === variationKey) {
          return {
            ...item,
            quantity: updatedCartItems[id][variationKey].quantity,
            subtotal: updatedCartItems[id][variationKey].quantity * item.price,
          };
        }
        return item;
      });

      setCartData(newCartData);
      setCartItems(updatedCartItems);

    } else if (updatedCartItems[id]) {
      // Handle non-variation product quantity change
      const currentQuantity = updatedCartItems[id].quantity;

      if (action === 'increase') {
        updatedCartItems[id].quantity = currentQuantity + 1;
      } else if (action === 'decrease' && currentQuantity > 1) {
        updatedCartItems[id].quantity = currentQuantity - 1;
      }

      const newCartData = cartData.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            quantity: updatedCartItems[id].quantity,
            subtotal: updatedCartItems[id].quantity * item.price,
          };
        }
        return item;
      });

      setCartData(newCartData);
      setCartItems(updatedCartItems);
    }

    // If a user is logged in, update the cart count on db
    if (token) {
      try {
        const updatedProduct = variationKey
          ? { productId: id, selectedVariation: variationKey, quantity: updatedCartItems[id][variationKey].quantity }
          : { productId: id, quantity: updatedCartItems[id].quantity };

        await axios.put(backendUrl + '/cart', updatedProduct, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
      } catch (error) {
        console.log(error);
        toast.error("Error updating cart on the server!");
      }
    }
  };

  const handleDeleteItem = async (id, variationKey) => {
    // Filter out the item with matching ID and variation key
    const updatedCart = cartData.filter(
      (item) => !(item.id === id && item.variation === variationKey)
    );

    setCartData(updatedCart);

    // Update global cartItems in ShopContext
    const updatedCartItems = { ...cartItems };

    if (variationKey) {
      // If it's a variation, delete the specific variation
      delete updatedCartItems[id][variationKey];

      // If no variations are left, delete the product entry
      if (Object.keys(updatedCartItems[id]).length === 0) {
        delete updatedCartItems[id];
      }
    } else {
      // For non-variation products
      delete updatedCartItems[id];
    }

    setCartItems(updatedCartItems);

    toast.success('Item removed from the cart successfully!');


    if (token) {
      try {
        // Construct payload for the backend
        const payload = variationKey
          ? { productId: id, selectedVariation: variationKey }
          : { productId: id };

        // Send DELETE request to the backend
        await axios.delete(`${backendUrl}/cart`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: payload, // For DELETE requests, payload is sent in the `data` field
        });

        toast.success("Cart updated!");
      } catch (error) {
        console.error(error);
        toast.error("Error deleting item from the cart!");
      }
    }
  };

  return (
    <>
      <Breadcrumbs />
      <div className='pt-4'>
        <div className="text-[20px] sm:text-3xl mb-3">
          <Title text1={'YOUR'} text2={'CART'} />
        </div>

        <div className="pt-14 border-border flex flex-col lg:flex-row lg:justify-between lg:gap-10">
          {/* Cart Table */}
          <div className="w-full lg:w-2/3 flex-1">
            <table className="w-full border-collapse">
              {/* Table Header */}
              <thead className="hidden lg:table-header-group">
                <tr className="text-left text-sm sm:text-lg border-b border-border">
                  <th className="pb-4 font-medium">Product</th>
                  <th className="pb-4 font-medium"></th>
                  <th className="pb-4 font-medium">Price</th>
                  <th className="pb-4 font-medium">Quantity</th>
                  <th className="pb-4 font-medium">Subtotal</th>
                  <th className="pb-4 font-medium"></th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>

                {
                  cartData.map((item, index) => {
                    // Find product data from flatProducts using the product ID
                    const productData = flatProducts.find((product) => Number(product.id) === Number(item.id));

                    if (!productData) {
                      console.error(`Product not found for ID: ${item.id}`);
                      return null;
                    }

                    // Get variation key and quantity from the item in cartData
                    const variationKey = item.variation;
                    const { quantity, price } = item;

                    // Calculate Subtotal for the current item
                    const subtotal = price * quantity;

                    return (
                      <tr
                        key={index}
                        className="border border-border rounded-lg lg:border-x-0 relative lg:border-border mb-4 lg:mb-0 flex flex-col lg:table-row mx-auto"
                      >
                        {/* Product Image */}
                        <td className="pt-8 lg:py-6 lg:table-cell flex lg:flex-none items-center justify-center md:justify-center">
                          <img
                            src={productData.image_urls[0]}
                            alt={productData.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded"
                          />
                        </td>

                        {/* Product Name - Variation */}
                        <td className="py-4 lg:py-6 lg:table-cell flex lg:flex-none flex-col items-center lg:items-start">
                          <p className='font-medium text-xl'>{productData.name}</p>
                          {variationKey && <p className="text-sm text-secondary pt-1"> {variationKey ? variationKey : ""}</p>}
                        </td>

                        {/* Price */}
                        <td className="py-4 lg:py-6 lg:table-cell flex lg:flex-none items-center justify-around w-full lg:w-auto lg:justify-start">
                          <p className="lg:hidden lg:font-medium">Price:</p>
                          <p>{currency} {price.toLocaleString()}</p>
                        </td>

                        {/* Quantity Adjustor */}
                        <td className="py-4 lg:py-6 lg:table-cell flex lg:flex-none items-center justify-around w-full lg:w-auto lg:justify-start">
                          <p className="lg:hidden lg:font-medium">Quantity:</p>
                          <div className="flex w-fit bg-border rounded items-center gap-2">
                            <button onClick={() => handleQuantityChange(item.id, variationKey, 'decrease')} className="px-2 py-1">-</button>
                            <span>{quantity}</span>
                            <button onClick={() => handleQuantityChange(item.id, variationKey, 'increase')} className="px-2 py-1">+</button>
                          </div>
                        </td>

                        {/* Subtotal */}
                        <td className="pb-8 pt-4 lg:py-6 lg:table-cell flex lg:flex-none items-center justify-around w-full lg:w-auto lg:justify-start">
                          <p className="lg:hidden font-semibold">Subtotal:</p>
                          <p className='text-accent '>{currency}    {subtotal.toLocaleString()}</p>
                        </td>

                        {/* Remove Button */}
                        <td className="py-4 lg:py-6 lg:table-cell flex lg:flex-none items-center justify-center lg:justify-start absolute top-2 right-3 lg:relative">
                          <XMarkIcon onClick={() => handleDeleteItem(item.id, variationKey)} className="text-red-500 size-5 cursor-pointer" />
                        </td>
                      </tr>


                    );
                  })
                }
              </tbody>
            </table>
          </div>

          <div className="w-full lg:w-1/3 mt-8 lg:mt-0">
            <div className="p-6 border-2 border-accent rounded-md">
              <CartTotal />
              <div className='w-full text-center'>
                <button onClick={() => navigate('/place-order')} className='bg-accent  hover:bg-bgdark hover:text-accent hover:border border-accent rounded text-bgdark text-base mt-8 mb-3 py-3 px-11'>PROCEED TO CHECKOUT</button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </>
  );
}

export default Cart

