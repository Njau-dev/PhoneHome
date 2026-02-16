'use client';

import { useHome } from '@/lib/hooks/useHome';
import BrandMarquee from './BrandMarquee';
import BrandSection from './BrandSection';
import BrandedSpinner from '@/components/common/BrandedSpinner';
import Title from '../common/Title';

const ShopByBrandsContainer = () => {
  const {
    brands,
    brandProducts,
    isLoading,
  } = useHome();

  return (
    <section className="w-full">
      <div className='mx-auto max-w-7xl'>
        <BrandMarquee />
      </div>

      <div className="w-full">
        <div className="mx-auto max-w-7xl">
          {/* Section title */}
          <div className="pt-12 pb-4">
            <Title text1='Shop by' text2='Brands' />
            <p className="mt-1 text-sm text-secondary">
              Explore top products from your favourite brands
            </p>
          </div>

          {/* Divider */}
          <div className="mb-6 h-px bg-border-light" />

          {/* Loading */}
          {isLoading && (
            <div className="flex min-h-100 items-center justify-center">
              <BrandedSpinner />
            </div>
          )}

          {/* Brand sections — one per brand that has at least 1 product */}
          {!isLoading && brands.map((brand) => {
            const products = brandProducts[brand.id] ?? [];
            return (
              <BrandSection
                key={brand.id}
                brand={brand}
                products={products}
              />
            );
          })}

          {/* Empty state */}
          {!isLoading && brands.length === 0 && (
            <div className="flex min-h-75 flex-col items-center justify-center text-center">
              <p className="text-lg font-semibold text-primary">
                No brands available
              </p>
              <p className="mt-1 text-sm text-secondary">
                Check back soon
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ShopByBrandsContainer;
