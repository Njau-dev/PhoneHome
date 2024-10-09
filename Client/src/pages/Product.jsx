import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext';

const Product = () => {

  const { productId } = useParams();
  const { products } = useContext(ShopContext);
  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState('');

  const fetchProductData = async () => {

    const allProducts = [...products.phones, ...products.laptops, ...products.tablets, ...products.audio];
    //switch to this code after populating the site with devices

    products.phones.map((item) => {
      if (item._id === productId) {
        setProductData(item);
        setImage(item.image[0]);

        console.log(item);

        return null;
      }
    })
  }

  //whenever product or product id is updated, we will get the product data and store it

  useEffect(() => {
    fetchProductData();
  }, [productId, products]);


  return productData ? (

    <div className='border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100'>

      {/* product data  */}
      <div className='flex gap-12 sm:gap-12 flex-col sm:flex-row'>

        {/* product images */}
        <div className='flex-1 flex flex-col-reverse gap-3 sm:flex-row'>
          <div className='flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full'>

            {
              productData.image.map((item, index) => (
                <img src={item} key={index} onClick={() => setImage(item)} className='w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer' alt="products" />
              ))
            }

          </div>

          <div className='w-full sm:w-[80%]'>
            <img src={image} className='w-full h-auto' alt="" />
          </div>
        </div>
      </div>
    </div>

  ) : <div className="opacity-0">Loading product</div>

}

export default Product
