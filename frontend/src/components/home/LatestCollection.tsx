'use client';

import { useEffect } from 'react';
import { useHomeStore } from '@/lib/stores/useHomeStore';
import BrandedSpinner from '@/components/common/BrandedSpinner';
import ProductItem from '../product/ProductItem';
import Title from '../common/Title';

const LatestCollection = () => {
  const {
    trendingProducts,
    isLoadingProducts,
    selectedProductType,
    productTypes,
    setSelectedProductType,
    fetchTrendingProducts,
  } = useHomeStore();

  useEffect(() => {
    fetchTrendingProducts();
  }, [fetchTrendingProducts]);

  return (
    <section className="w-full px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-4 sm:mb-8">
          <Title text1='Trending' text2='Products' />
        </div>

        {/* Product Type Tabs */}
        <div className="mb-8 flex flex-wrap gap-3 border-b border-border-light pb-4">
          {productTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedProductType(type.value)}
              className={`
                relative px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200
                ${selectedProductType === type.value
                  ? 'text-primary'
                  : 'text-secondary hover:text-primary'
                }
              `}
            >
              {type.label}
              {selectedProductType === type.value && (
                <span className="absolute -bottom-4.25 left-0 h-0.5 w-full bg-accent"></span>
              )}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {isLoadingProducts ? (
          <div className="flex min-h-100 items-center justify-center">
            <BrandedSpinner />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {trendingProducts.map((product) => (
                <ProductItem key={product.id} product={product} />
              ))}
            </div>

            {/* Empty State */}
            {trendingProducts.length === 0 && (
              <div className="flex min-h-100 flex-col items-center justify-center text-center">
                <svg
                  className="mb-4 h-16 w-16 text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="mb-2 text-lg font-semibold text-primary">
                  No products found
                </h3>
                <p className="text-sm text-secondary">
                  Check back soon for new {productTypes.find(t => t.value === selectedProductType)?.label.toLowerCase()}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default LatestCollection;