'use client';

import BrandedSpinner from '@/components/common/BrandedSpinner';
import ProductItem from '../product/ProductItem';
import Title from '../common/Title';
import { useHome } from '@/lib/hooks/useHome';
import { BookOpen } from 'lucide-react';

const LatestCollection = () => {
  const {
    filteredTrending,
    isLoading,
    selectedProductType,
    productTypes,
    setProductType
  } = useHome()

  return (
    <section className="w-full py-12">
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
              onClick={() => setProductType(type.value)}
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
        {isLoading ? (
          <div className="flex min-h-100 items-center justify-center">
            <BrandedSpinner />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredTrending.map((product) => (
                <ProductItem key={product.id} product={product} />
              ))}
            </div>

            {/* Empty State */}
            {filteredTrending.length === 0 && (
              <div className="flex min-h-100 flex-col items-center justify-center text-center">
                <BookOpen />
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