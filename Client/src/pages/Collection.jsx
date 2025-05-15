import React, { useContext, useState, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';
import { useLocation, useParams } from 'react-router-dom';
import Pagination from '../components/Pagination';
import Breadcrumbs from '../components/BreadCrumbs';
import BrandedSpinner from '../components/BrandedSpinner';

const Collection = () => {

  const { products, search, backendUrl, currency } = useContext(ShopContext);
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);

  // state to track selected category to display brands
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sortOption, setSortOption] = useState('relevant');
  const { category } = useParams();

  // Price range filter states
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500000);
  const [currentMinPrice, setCurrentMinPrice] = useState(0);
  const [currentMaxPrice, setCurrentMaxPrice] = useState(500000);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 30;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);


  //fetching all cetegories from backend to use them for filtering
  useEffect(() => {
    axios.get(backendUrl + '/categories')
      .then((response) => {
        setCategories(response.data.categories);
      })
      .catch((error) => {
        console.error('Error fetching categories:', error);
      });
  }, []);

  //brand fetching based on selected category
  useEffect(() => {
    if (selectedCategory) {
      // Find the category object from categories array
      const category = categories.find(cat => cat.name === selectedCategory);

      if (category) {
        axios.get(backendUrl + `/brands?category=${category.id}`)
          .then((response) => {
            setBrands(response.data);
          })
          .catch((error) => {
            console.error('Error fetching brands:', error);
          });
      }
    } else {
      setBrands([]);
    }
  }, [selectedCategory, categories]);

  // Set selected category based on URL parameter
  useEffect(() => {
    // Get category from either URL params or query params
    const urlCategory = category || queryParams.get('category');
    const urlBrand = queryParams.get('brand');

    if (urlCategory) {
      const formattedCategory = urlCategory.charAt(0).toUpperCase() + urlCategory.slice(1);
      setSelectedCategory(formattedCategory);
      handleCategoryChange(formattedCategory);
    }

    if (urlBrand) {
      setSelectedBrand(urlBrand);
    }
  }, [category, location.search]);

  // Fetch all products from the /products endpoint
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);

    //flatten products from object and combine to form one array
    const flattenedProducts = [
      ...(products.phones || []),
      ...(products.tablets || []),
      ...(products.laptops || []),
      ...(products.audio || [])
    ];

    try {
      setFilterProducts(flattenedProducts);
    } catch (error) {
      setError('Failed to fetch products. Please try again.');
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  //category change handling
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedBrand(null);
  };

  //brand change handling
  const handleBrandChange = (brand) => {
    setSelectedBrand(selectedBrand === brand ? null : brand);
  };

  // Handle minimum price input change
  const handleMinPriceChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    if (value >= 0) {
      setCurrentMinPrice(value);
    }
  };

  // Handle maximum price input change
  const handleMaxPriceChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    if (value >= 0) {
      setCurrentMaxPrice(value);
    }
  };

  // Apply price filter
  const applyPriceFilter = () => {
    // Ensure min price is not greater than max price
    if (currentMinPrice > currentMaxPrice) {
      // If min price is greater than max price, set max price to min price
      setMaxPrice(currentMinPrice);
      setMinPrice(currentMinPrice);
    } else {
      setMinPrice(currentMinPrice);
      setMaxPrice(currentMaxPrice);
    }
    // Reset to page 1 when applying new filters
    setCurrentPage(1);
  };

  // Clear Filters handler
  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedBrand(null);
    setBrands([]);
    setMinPrice(0);
    setMaxPrice(500000);
    setCurrentMinPrice(0);
    setCurrentMaxPrice(500000);
    setCurrentPage(1);
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
    // Check if price is within range
    const priceInRange = item.price >= minPrice && item.price <= maxPrice;
    const categoryMatch = !selectedCategory || item.category === selectedCategory;
    const brandMatch = !selectedBrand || item.brand === selectedBrand;
    const searchMatch = item.name.toLowerCase().includes(search.toLowerCase()); // Search filter
    return categoryMatch && brandMatch && searchMatch && priceInRange;
  });

  // Calculate pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  console.log(currentProducts);

  return (
    <>
      <Breadcrumbs />

      <div className='flex flex-col sm:flex-row gap-1 sm:gap-10 pt-4'>

        {/* Filter Options */}

        <div className='min-w-60'>
          <p onClick={() => setShowFilter(!showFilter)} className='my-2 text-xl flex items-center cursor-pointer gap-2'>FILTERS
            <ChevronDownIcon className={`h-3 sm:hidden ${showFilter ? 'rotate-180' : ''}`} />
          </p>

          {/* PRICE RANGE FILTER */}
          <div className={`border border-border rounded-lg px-5 py-3 my-7 ${showFilter ? '' : 'hidden'} sm:block`}>
            <p className='mb-3 text-sm font-medium'>PRICE RANGE</p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 flex-col">
                <div className="flex flex-col w-full">
                  <label htmlFor="minPrice" className="text-xs text-secondary mb-1">Min Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary">{currency}</span>
                    <input
                      id="minPrice"
                      type="number"
                      min="0"
                      value={currentMinPrice}
                      onChange={handleMinPriceChange}
                      className="w-full bg-bgdark border border-border rounded-md py-2 pl-12 pr-2 text-sm"
                      placeholder="Min Price"
                    />
                  </div>
                </div>

                <div className="flex flex-col w-full">
                  <label htmlFor="maxPrice" className="text-xs text-secondary mb-1">Max Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary">{currency}</span>
                    <input
                      id="maxPrice"
                      type="number"
                      min="0"
                      value={currentMaxPrice}
                      onChange={handleMaxPriceChange}
                      className="w-full bg-bgdark border border-border rounded-md py-2 pl-12 pr-2 text-sm"
                      placeholder="Max Price"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={applyPriceFilter}
                className="mt-2 bg-accent hover:bg-bgdark hover:text-accent hover:border border-accent text-bgdark text-sm py-1 px-3 rounded-full transition duration-300"
              >
                Apply Price Filter
              </button>
            </div>
          </div>

          {
            categories ? (
              <>

                {/* CATEGORIES FILTER */}
                <div div className={`border border-border rounded-lg pl-5 py-3 my-7 ${showFilter ? '' : 'hidden'} sm:block`}>
                  <p className='mb-3 text-sm font-medium'>CATEGORIES</p>
                  <div className="flex flex-col gap-2 text-sm font-light text-primary">

                    {
                      categories.map((category) => (
                        <div key={category.id} className='flex gap-2 items-center'>
                          <label className="flex gap-2 items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className='hidden peer'
                              onChange={() => handleCategoryChange(category.name)}
                              checked={selectedCategory === category.name}
                            />

                            <div className="w-5 h-5 border-2 peer-checked:bg-accent peer-checked:border-primary transition duration-300 rounded-full"></div>
                            <span className="ml-2 text-base">{category.name}</span>

                          </label>
                        </div>
                      ))}

                  </div>

                  {/* Clear Filters Button */}
                  <button onClick={clearFilters} className="mt-3 text-red-500 hover:underline">Clear Filters</button>
                </div>

              </>
            ) : (<></>)
          }


          {/* Brands */}
          {selectedCategory && (
            <div className={`border border-border rounded-lg pl-5 py-3 my-6 ${showFilter ? '' : 'hidden'} sm:block`}>
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
                        <div className="w-5 h-5 border-2 peer-checked:bg-accent peer-checked:border-primary transition duration-300 rounded-full"></div>
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

          {/* Loading and Error States */}
          {isLoading ? (
            <BrandedSpinner message='Loading products...' />
          ) : error ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={fetchProducts}
                className="bg-accent hover:bg-bgdark hover:text-accent hover:border border-accent text-bgdark font-medium py-2 px-6 rounded-full transition duration-300"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Display filtered product count */}
              <p className="text-sm text-secondary mb-4">
                Showing {Math.min(currentProducts.length, productsPerPage)} of {filteredProducts.length} products
              </p>

              {/* Display products */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {Array.isArray(currentProducts) && currentProducts.length > 0 ? (
                  currentProducts.map((product, index) => (
                    <ProductItem
                      key={index}
                      name={product.name}
                      id={product.id}
                      price={product.price}
                      image={product.image_urls}
                      category={product.category}
                      hasVariation={product.hasVariation}
                      rating={product.rating}
                      review_count={product.review_count}
                    />
                  ))
                ) : (
                  <p className="col-span-full text-center text-secondary py-10">
                    No products available.
                  </p>
                )}
              </div>

              {/* Pagination Component */}
              {filteredProducts.length > productsPerPage && (
                <div className="mt-10">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    paginate={paginate}
                  />
                </div>
              )}
            </>
          )}

        </div>
      </div >
    </>
  )
}

export default Collection