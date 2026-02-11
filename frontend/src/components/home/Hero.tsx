'use client';

import { useHome } from '@/lib/hooks/useHome';
import FeaturedBannerCard from './FeaturedBannerCard';

const Hero = () => {
  const { featuredBanners } = useHome();

  // Sort banners by position
  const sortedBanners = [...featuredBanners].sort((a, b) => a.position - b.position);

  return (
    <section className="w-full py-8">
      <div className="mx-auto max-w-7xl">
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