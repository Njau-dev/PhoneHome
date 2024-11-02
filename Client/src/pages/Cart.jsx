import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title';

const Cart = () => {

  const { products, currency, cartItems } = useContext(ShopContext);

  // Within the Cart component
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

      if (typeof productData === 'object') { // Product with variations
        for (const variation in productData) {
          if (productData[variation] > 0) {
            tempData.push({
              id: productId,
              variation: variation,
              quantity: productData[variation]
            });
          }
        }
      } else { // Product without variations
        if (productData > 0) {
          tempData.push({
            id: productId,
            quantity: productData
          });
        }
      }
    }

    setCartData(tempData);
    console.log(tempData);

  }, [cartItems]);


  return (
    <div className='border-t pt-14 border-border'>

      <div className="text-2xl mb-3">
        <Title text1={'YOUR'} text2={'CART'} />
      </div>

      <div>
        {
          cartData.map((item, index) => {
            // Find product data from flatProducts using the product ID
            const productData = flatProducts.find((product) => product.id === Number(item.id));

            if (!productData) {
              console.error(`Product not found for ID: ${item.id}`);
              return null; // Fallback UI if needed
            }

            // Get variation key and quantity from the item in cartData
            const variationKey = item.variation;
            const { quantity } = item;

            // Determine the price based on variation key
            let price = productData.price; // Default to base price
            if (variationKey && productData.variations) {
              // Locate the variation object within the product variations array
              const selectedVariation = productData.variations.find(variation =>
                `${variation.ram}-${variation.storage}` === variationKey
              );
              if (selectedVariation) {
                price = selectedVariation.price; // Use variation price if it exists
              }
            }

            return (
              <div key={index} className='py-4 border-t border-b border-border text-primary grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4'>
                <div className='flex items-start gap-6'>
                  {/* Product Image */}
                  <img src={productData.image_urls[0]} className='w-16 sm:w-20' alt={productData.name} />

                  <div>
                    {/* Product Name */}
                    <p className='text-xs sm:text-lg font-medium py-2'>{productData.name}</p>

                    {/* Display Variation and Price */}
                    <div className='flex items-center gap-5 mt-2'>
                      <p>Variation: {variationKey || "N/A"}</p>
                      <p>
                        {currency}{price} {/* Show price here, either base or variation price */}
                      </p>
                    </div>

                    {/* Display Quantity */}
                    <p className='text-sm sm:text-lg font-medium'>Quantity: {quantity}</p>
                  </div>
                </div>
              </div>
            );
          })
        }

      </div>




    </div>
  )
}

export default Cart

