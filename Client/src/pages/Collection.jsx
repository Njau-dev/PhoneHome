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
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sortOption, setSortOption] = useState('relevant');


  //fetching cetegories from backend to use them for filtering

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/categories')
      .then((response) => {
        setCategories(response.data.categories);

      })

      .catch((error) => {
        console.error('Error fetching categories:', error);
      });
  }, []);


  useEffect(() => {
    if (selectedCategory) {
      axios.get(`http://127.0.0.1:5000/brands?category=${selectedCategory}`)
        .then((response) => {
          setBrands(response.data);
        })
        .catch((error) => {
          console.error('Error fetching brands:', error);
        });
    } else {
      setBrands([]);
    }
  }, [selectedCategory]);



  // Fetch all products from the /products endpoint
  useEffect(() => {
    axios.get('http://127.0.0.1:5000/products')
      .then((response) => {
        console.log('Fetched all products:', response.data);

        // Set filterProducts to the array of all products
        setFilterProducts(response.data.products);
      })
      .catch((error) => {
        console.error('Error fetching products:', error);
      });
  }, []);


  //category change handling
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedBrand(null);
  };

  //brand change handling
  const handleBrandChange = (brand) => {
    setSelectedBrand(selectedBrand === brand ? null : brand);
  };

  // Clear Filters handler
  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedBrand(null);
    setBrands([]); // Clear brands when filters are cleared
  };

  // Sorting products based on selected option
  const sortedProducts = [...filterProducts].sort((a, b) => {
    switch (sortOption) {
      case 'low-high':
        return a.price - b.price;
      case 'high-low':
        return b.price - a.price;
      default:
        return 0;
    }
  });

  // filter logic
  const filteredProducts = sortedProducts.filter((item) => {
    const categoryMatch = !selectedCategory || item.category === selectedCategory;
    const brandMatch = !selectedBrand || item.brand === selectedBrand;
    const searchMatch = item.name.toLowerCase().includes(search.toLowerCase()); // Search filter
    return categoryMatch && brandMatch && searchMatch;
  });


  return (
    <div className='flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t border-border'>

      {/* Filter Options */}
      <div className='min-w-60'>
        <p onClick={() => setShowFilter(!showFilter)} className='my-2 text-xl flex items-center cursor-pointer gap-2'>FILTERS
          <ChevronDownIcon className={`h-3 sm:hidden ${showFilter ? 'rotate-180' : ''}`} />
        </p>

        {/* CATEGORIES FILTER */}

        <div className={`border border-border pl-5 py-3 my-7 ${showFilter ? '' : 'hidden'} sm:block`}>
          <p className='mb-3 text-sm font-medium'>CATEGORIES</p>
          <div className="flex flex-col gap-2 text-sm font-light text-primary">

            {categories.map((category) => (
              <div key={category.id} className='flex gap-2 items-center'>
                <label className="flex gap-2 items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className='hidden peer'
                    onChange={() => handleCategoryChange(category.name)}
                    checked={selectedCategory === category.name}
                  />

                  <div className="w-5 h-5 border-2 peer-checked:bg-accent peer-checked:border-primary transition duration-300"></div>
                  <span className="ml-2 text-base">{category.name}</span>

                </label>
              </div>
            ))}

          </div>

          {/* Clear Filters Button */}
          <button onClick={clearFilters} className="mt-3 text-red-500 hover:underline">Clear Filters</button>

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

          <select value={sortOption}
            onChange={(e) => setSortOption(e.target.value)} className='border border-border bg-bgdark text-sm px-3 py-2 mb-3'>
            <option value="relevant">Sort by: Relevant</option>
            <option value="low-high">Sort by: Low to High</option>
            <option value="high-low">Sort by: High to Low</option>
          </select>
        </div>

        {/* Display products */}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">

          {Array.isArray(filteredProducts) && filteredProducts.length > 0 ? (
            filteredProducts.map((product, index) => (
              <ProductItem key={index} name={product.name} id={product.id} price={product.price} image={product.image_urls} category={product.category} />
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
