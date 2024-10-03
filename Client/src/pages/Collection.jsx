import React, { useContext, useState, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';

const Collection = () => {

  const { products, search, showSearch } = useContext(ShopContext);
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);

  // state to track selected category to display brands

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brands, setBrands] = useState([]);
 
  //fetching cetegories with their specific brands

  useEffect(() => {
    if (selectedCategory) {

      if (selectedCategory === 'Tecno') {
        axios.get(`http://127.0.0.1:5000/brands?category=${selectedCategory}`)
          .then((response) => {
            setBrands(response.data); 
          })
          .catch((error) => {
            console.error('Error fetching brands:', error);
          });
      } else {

        // Dummy data for categories that haven't been updated on the backend yet
        const dummyData = {
          Tablets: [{ id: 1, name: 'iPad' }, { id: 2, name: 'Samsung Galaxy Tab' }],
          Audio: [{ id: 1, name: 'Sony' }, { id: 2, name: 'JBL' }],
          Laptops: [{ id: 1, name: 'Dell' }, { id: 2, name: 'HP' }]
        };
        setBrands(dummyData[selectedCategory] || []);
      }
      
    }
  }, [selectedCategory]);


    useEffect(() => {
      // Fetch products from the /phones endpoint
      axios.get('http://127.0.0.1:5000/phones')
        .then((response) => {
          console.log('Fetched display products:', response.data);
          // Set filterProducts to the array of phone products
          setFilterProducts(response.data);
        })
        .catch((error) => {
          console.error('Error fetching products:', error);
        });
    }, []);
  
  //category change handling
  
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  //brand change handling
  const handleBrandChange = (brand) => {
    setSelectedBrand(brand);
  };

  const filteredProducts = filterProducts.filter((item) => {
    const categoryMatch = selectedCategory ? item.category === selectedCategory : true;
    const brandMatch = selectedBrand ? item.brand === selectedBrand : true;
    return categoryMatch && brandMatch;
  });


  return (
    <div className='flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t border-border'>

      {/* Filter Options */}
      <div className='min-w-60'>
        <p onClick={() => setShowFilter(!showFilter)} className='my-2 text-xl flex items-center cursor-pointer gap-2'>FILTERS
          <ChevronDownIcon className={`h-3 sm:hidden %{showFilter ? 'rotate-90' : ''}`} />
        </p>

        {/* CATEGORIES */}

        <div className={`border border-border pl-5 py-3 my-7 ${showFilter ? '' : 'hidden'} sm:block`}>
          <p className='mb-3 text-sm font-medium'>CATEGORIES</p>
            <div className="flex flex-col gap-2 text-sm font-light text-primary">
              <p className='flex gap-2 items-center'>
                <label className="flex gap-2 items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className='hidden peer' 
                    onChange={() => handleCategoryChange('Tecno')} 
                    checked={selectedCategory === 'Tecno'}
                  />
                  <div className="w-5 h-5 border-2  peer-checked:bg-accent peer-checked:border-primary transition duration-300"></div>
                  <span className="ml-2 text-base">Phones</span>
                </label>
              </p>
              
              <p className='flex gap-2 items-center'>
                <label className="flex gap-2 items-center cursor-pointer">
                  <input type="checkbox" className='hidden peer' onChange={() => handleCategoryChange('Tablets')} checked={selectedCategory === 'Tablets'} />
                  <div className="w-5 h-5 border-2 peer-checked:bg-accent peer-checked:border-primary transition duration-300"></div>
                  <span className="ml-2 text-base">Tablets</span>
                </label>
              </p>
              
              <p className='flex gap-2 items-center'>
                <label className="flex gap-2 items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className='hidden peer' 
                    onChange={() => handleCategoryChange('Audio')} 
                    checked={selectedCategory === 'Audio'}
                  />
                  <div className="w-5 h-5 border-2 peer-checked:bg-accent peer-checked:border-primary transition duration-300"></div>
                  <span className="ml-2 text-base">Audio</span>
                </label>
              </p>
              
              <p className='flex gap-2 items-center'>
                <label className="flex gap-2 items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className='hidden peer' 
                    onChange={() => handleCategoryChange('Laptops')} 
                    checked={selectedCategory === 'Laptops'}
                  />
                  <div className="w-5 h-5 border-2 peer-checked:bg-accent peer-checked:border-primary transition duration-300"></div>
                  <span className="ml-2 text-base">Laptops</span>
                </label>
              </p>
            </div>
        </div>

        {/* Brands */}

        {selectedCategory && (
          <div className={`border border-border pl-5 py-3 my-6`}>
            <p className='mb-3 text-sm font-medium'>BRANDS</p>
            <div className="flex flex-col gap-2 text-sm font-light text-primary">
              {brands.length > 0 ? (
                brands.map((brand) => (
                  <p key={brand.id} className='flex gap-2 items-center'>
                    <label className="flex gap-2 items-center cursor-pointer">
                      {/* label to enable clicking on name */}
                      <input 
                        type="checkbox" 
                        className='hidden peer' 
                        value={brand.name} 
                        onChange={() => handleBrandChange(brand.name)} 
                        checked={selectedBrand === brand.name}
                      />
                      <div className="w-5 h-5 border-2 peer-checked:bg-accent peer-checked:border-primary transition duration-300"></div>
                      <span className="ml-2">{brand.name}</span>
                    </label>
                  </p>
                ))
              ) : (
                <p>No brands available for this category.</p>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Right side */}

      <div className='flex-1'>

        <div className='flex justify-between items-center text-lg sm:text-2xl my-3'>
          <Title text1={'ALL'} text2={'PRODUCTS'} />

          {/* PRODUCT SORTING  */}

          <select className='border border-border bg-bgdark text-sm px-3 py-2 mb-3'>
            <option value="relevant">Sort by: Relevant</option>
            <option value="low-high">Sort by: Low to High</option>
            <option value="high-low">Sort by: High to Low</option>
          </select>
        </div>

        {/* Display products */}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">

          {Array.isArray(filteredProducts) && filteredProducts.length > 0 ? (
            filteredProducts.map((item, index) => (
              <ProductItem key={index} name={item.name} id={item.id} price={item.price} image={item.image} />
            ))
          ) : (
            <p>No products available.</p>
          )}

        </div>

      </div>

    </div>
  )
}

export default Collection
