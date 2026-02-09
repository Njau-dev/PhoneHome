'use client';

import { useEffect } from 'react';
import { useHomeStore } from '@/lib/stores/useHomeStore';
import FeaturedBannerCard from './FeaturedBannerCard';
import BrandedSpinner from '@/components/common/BrandedSpinner';

const Hero = () => {
  const {
    featuredBanners,
    isLoadingBanners,
    fetchFeaturedBanners
  } = useHomeStore();

  useEffect(() => {
    fetchFeaturedBanners();
  }, [fetchFeaturedBanners]);

  if (isLoadingBanners) {
    return (
      <div className="flex min-h-125 items-center justify-center">
        <BrandedSpinner />
      </div>
    );
  }

  // Sort banners by position
  const sortedBanners = [...featuredBanners].sort((a, b) => a.position - b.position);

  return (
    <section className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Hero Grid Layout */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2">
          {sortedBanners.map((banner) => (
            <FeaturedBannerCard key={banner.id} banner={banner} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;