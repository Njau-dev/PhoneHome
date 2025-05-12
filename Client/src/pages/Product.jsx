import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { Square3Stack3DIcon, StarIcon } from '@heroicons/react/24/outline';
import { ShopContext } from '../context/ShopContext';
import { HeartIcon } from '@heroicons/react/24/outline';
import RelatedProducts from '../components/RelatedProducts';
import { toast } from 'react-toastify';
import Breadcrumbs from '../components/BreadCrumbs';
import BrandedSpinner from '../components/BrandedSpinner';

const Product = () => {
  const { productId } = useParams();
  const [productData, setProductData] = useState({});
  const [image, setImage] = useState('');
  const { currency, addToCart, backendUrl, addToWishlist, addToCompare } = useContext(ShopContext);
  const [variations, setVariations] = useState([]);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch product data from the backend
  const fetchProductData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(backendUrl + `/product/${productId}`);

      const data = response.data;
      setProductData(data);
      setImage(data.image_urls[0]);

      if (data.variations) {
        setVariations(data.variations);
      }

      setPrice(data.price)
    } catch (error) {
      setError('Failed to load product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch the product data when the productId changes
  useEffect(() => {
    fetchProductData();
    setSelectedVariation(null)
  }, [productId]);

  // Handle variation selection
  const handleVariationSelect = (variation) => {
    setSelectedVariation(variation);
    setPrice(variation.price);
  };

  // Quantity change
  const handleQuantityChange = (value) => {
    setQuantity((prevQuantity) =>
      value === 'increase' ? prevQuantity + 1 : prevQuantity > 1 ? prevQuantity - 1 : 1
    );
  };

  const hasVariations = productData.variations && productData.variations.length > 0;

  const handleAddToCart = () => {
    if (hasVariations && !selectedVariation) {
      toast.error('Please select a variation before adding to cart');
    } else if (!hasVariations) {
      addToCart(productId, null, quantity);
      toast.success(`Added ${productData.name} to the cart`);

    } else {
      // For products with selected variation
      addToCart(productId, selectedVariation, quantity);

      // console.log(selectedVariation);
      toast.success(`Added ${productData.name} with selected variation to the cart`);
    }
  };


  // Add to wishlist logic
  const handleAddToWishlist = () => {
    addToWishlist(productId);
  };

  const handleAddToCompare = () => {
    addToCompare(productId)
  }

  return productData ? (
    <>
      {loading ? (
        <BrandedSpinner message="Loading product..." />
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchProductData}
            className="bg-accent hover:bg-bgdark hover:text-accent hover:border border-accent text-bgdark font-medium py-2 px-6 rounded-full transition duration-300"
          >
            Try Again
          </button>
        </div>
      ) : !productData ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <p className="text-red-500 mb-4">No product found</p>
          <Link
            to="/collection"
            className="bg-accent hover:bg-bgdark hover:text-accent hover:border border-accent text-bgdark font-medium py-2 px-6 rounded-full transition duration-300"
          >
            Back to Collection
          </Link>
        </div>
      ) : (
        <>
          <Breadcrumbs productData={productData} />
          <div className='pt-4 transition-opacity ease-in duration-500 opacity-100'>
            {/* Product data */}
            <div className='flex gap-12 sm:gap-0 flex-col sm:flex-row'>
              {/* Product images */}
              <div className='flex-1 flex flex-col-reverse gap-3 justify-end'>
                <div className='flex overflow-x-auto gap-3 w-full'>
                  {
                    productData.image_urls.map((item, index) => (
                      <img
                        src={item}
                        key={index}
                        onClick={() => setImage(item)}
                        className='w-[24%] md:w-[15%] flex-shrink-0 cursor-pointer rounded-xl'
                        alt="product"
                      />
                    ))
                  }
                </div>
                <div className='w-full sm:w-[80%]'>
                  <img src={image} className='w-full h-auto rounded-lg' alt="main product" />
                </div>
              </div>

              {/* ---product information  */}
              <div className='flex-1'>
                <h1 className="font-medium text-3xl mt-2">
                  {productData.name}
                </h1>

                {/* Ratings */}
                <div className='flex items-center gap-1 mt-2'>
                  <StarIcon className="w-3.5" fill='white' />
                  <StarIcon className="w-3.5" fill='white' />
                  <StarIcon className="w-3.5" fill='white' />
                  <StarIcon className="w-3.5" fill='white' />
                  <StarIcon className="w-3.5" />

                  <p className='pl-2'>(57) Reviews</p>
                </div>

                {/* ----- add stock quantity here afterwards ------ */}


                <p className='mt-5 text-2xl font-medium text-accent'>{currency} {price}</p>

                {/* Product Key Features */}
                <div className='mt-4'>
                  <h2 className="text-lg font-medium">Key Features</h2>

                  <ul className="mt-2 list-disc pl-5 space-y-2 text-gray-400">

                    {
                      productData.category === 'Phone' || productData.category === 'Tablet' ? (
                        <>
                          <li><strong>RAM:</strong> {productData.ram}</li>
                          <li><strong>Internal Storage:</strong> {productData.storage}</li>
                          <li><strong>Processor:</strong> {productData.processor}</li>
                          <li><strong>Main Camera:</strong> {productData.main_camera}</li>
                          <li><strong>Front Camera:</strong> {productData.front_camera}</li>
                          <li><strong>Display:</strong> {productData.display}</li>
                          <li><strong>Operating System:</strong> {productData.os}</li>
                          <li><strong>Connectivity:</strong> {productData.connectivity}</li>
                          <li><strong>Colors:</strong> {productData.colors}</li>
                          <li><strong>Battery:</strong> {productData.battery}</li>
                        </>
                      ) : productData.type === 'audio' ? (
                        // Render only battery for audio products
                        <li><strong>Battery:</strong> {productData.battery}</li>
                      ) : productData.type === 'laptop' ? (
                        <>
                          <li><strong>RAM:</strong> {productData.ram}</li>
                          <li><strong>Internal Storage:</strong> {productData.storage}</li>
                          <li><strong>Display:</strong> {productData.display}</li>
                          <li><strong>Processor:</strong> {productData.processor}</li>
                          <li><strong>Operating System:</strong> {productData.os}</li>
                          <li><strong>Battery:</strong> {productData.battery}</li>
                        </>
                      ) : null
                    }

                  </ul>

                </div>

                {/* Information Box */}
                <div className='bg-border rounded-md p-4 mt-6'>
                  <p>Please <Link className='text-accent' to='/contact'>contact our shop</Link> directly before placing your order for the most accurate pricing information.</p>
                </div>

                {/* Variation input based on product type */}

                <div className='flex flex-col gap-4 my-8'>


                  {productData.category === 'Phone' || productData.category === 'Tablet' ? (
                    productData.hasVariation ? (
                      <>
                        <p>Select Storage Variation</p>

                        <div className='flex flex-wrap gap-2'>

                          {productData.variations.map((item, index) => (

                            <button
                              key={index}
                              onClick={() => {
                                handleVariationSelect(item);
                              }}
                              className={`border border-border rounded-3xl py-3 px-6 ${selectedVariation === item ? 'bg-accent text-bgdark' : ''}`}
                            >
                              {item.ram} / {item.storage}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : ('')
                  ) : null}



                  {/* Price display after selecting a variation */}
                  {selectedVariation && (
                    <div className='mt-4'>
                      <p className='mt-5 text-2xl font-medium text-accent'>
                        Price: {currency} {price}
                      </p>
                    </div>
                  )}

                </div>

                <div className="product-actions  flex items-center mt-4 space-x-4">

                  {/* Quantity Input */}

                  <div className="quantity-selector rounded-3xl flex items-center border border-accent">
                    <button
                      onClick={() => handleQuantityChange('decrease')}
                      className="px-4 py-2 text-lg font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      readOnly
                      className="w-16 text-center text-primary text-lg outline-none bg-bgdark"
                    />
                    <button
                      onClick={() => handleQuantityChange('increase')}
                      className="px-4 py-2 text-lg font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart Button */}

                  <button
                    onClick={handleAddToCart}
                    // disabled={variations && variations.length > 0 && !selectedVariation}
                    className={`bg-accent hover:bg-bgdark hover:text-accent hover:border border-accent text-bgdark font-semibold w-[60%] py-3 px-6 active:bg-accent active:text-bgdark rounded-3xl ${(!selectedVariation && variations.length > 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Add to Cart
                  </button>
                </div>

                {/* Add to Wishlist and compare Buttons */}
                <div className='flex items-center mt-4 space-x-4'>
                  <HeartIcon onClick={handleAddToWishlist}
                    className="bg-bgdark h-12 hover:fill-accent text-accent font-semibold py-2 px-6 hover:cursor-pointer"
                  />  <span>Add to Wishlist</span>


                  <Square3Stack3DIcon onClick={handleAddToCompare}
                    className="bg-bgdark h-12 hover:scale-105 text-accent font-semibold py-2 px-6 hover:cursor-pointer" />   <span>Compare specs</span>

                </div>

              </div>

            </div>

            {/* ---- DESCRIPTION & Review --- */}
            <div className='mt-20'>
              <div className='flex'>
                <b className='border border-border px-5 py-3 text-sm'>Description </b>
                <p className='border border-border px-5 py-3 text-sm'>Reviews (57)</p>
              </div>

              <div className='flex flex-col gap-4 border border-border px-6 py-6  text-sm text-gray-500'>
                <p>{productData.description}</p>

                <ul className="mt-2 list-disc pl-5 space-y-2 text-gray-400">

                  {
                    productData.type === 'phone' || productData.type === 'tablet' ? (
                      <>
                        <li><strong>RAM:</strong> {productData.ram}</li>
                        <li><strong>Internal Storage:</strong> {productData.storage}</li>
                        <li><strong>Processor:</strong> {productData.processor}</li>
                        <li><strong>Main Camera:</strong> {productData.main_camera}</li>
                        <li><strong>Front Camera:</strong> {productData.front_camera}</li>
                        <li><strong>Display:</strong> {productData.display}</li>
                        <li><strong>Operating System:</strong> {productData.os}</li>
                        <li><strong>Connectivity:</strong> {productData.connectivity}</li>
                        <li><strong>Colors:</strong> {productData.colors}</li>
                        <li><strong>Battery:</strong> {productData.battery}</li>
                      </>
                    ) : productData.type === 'audio' ? (
                      // Render only battery for audio products
                      <li><strong>Battery:</strong> {productData.battery}</li>
                    ) : productData.type === 'laptop' ? (
                      <>
                        <li><strong>RAM:</strong> {productData.ram}</li>
                        <li><strong>Internal Storage:</strong> {productData.storage}</li>
                        <li><strong>Display:</strong> {productData.display}</li>
                        <li><strong>Processor:</strong> {productData.processor}</li>
                        <li><strong>Operating System:</strong> {productData.os}</li>
                        <li><strong>Battery:</strong> {productData.battery}</li>
                      </>
                    ) : null
                  }
                </ul>
              </div>

            </div>

            {/* ----Related Products */}

            <RelatedProducts category={productData.category} brand={productData.brand} />

          </div >
        </>
      )}

    </>

  ) : <div className="opacity-0">No product found</div>;
};

export default Product;
