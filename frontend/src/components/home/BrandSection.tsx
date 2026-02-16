'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { Product } from '@/lib/types/product';
import ProductItem from '../product/ProductItem';
import { BrandWithCount } from '@/lib/types/home';

// Brand → gradient config
// Add / adjust colours for any brand you carry
const BRAND_GRADIENTS: Record<string, { from: string; to: string }> = {
  Samsung: { from: '#1428a0', to: '#0077c8' },
  Apple: { from: '#1c1c1e', to: '#3a3a3c' },
  Xiaomi: { from: '#ff6900', to: '#ff9500' },
  Oppo: { from: '#1a1a2e', to: '#16213e' },
  Vivo: { from: '#415fff', to: '#6e82ff' },
  OnePlus: { from: '#eb0029', to: '#ff5a6e' },
  Huawei: { from: '#cf0a2c', to: '#e83554' },
  Lenovo: { from: '#e2231a', to: '#ff5a53' },
  HP: { from: '#0096d6', to: '#00b4e6' },
  Dell: { from: '#007db8', to: '#00a2e8' },
  Sony: { from: '#000000', to: '#333333' },
  JBL: { from: '#f5821f', to: '#ffa947' },
  Microsoft: { from: '#737373', to: '#a0a0a0' },
  Oraimo: { from: '#00b140', to: '#00d957' },
  Beats: { from: '#d20012', to: '#ff1a2e' },
};

const DEFAULT_GRADIENT = { from: '#374151', to: '#6b7280' };

interface BrandSectionProps {
  brand: BrandWithCount;
  products: Product[];
}

const BrandSection = ({ brand, products }: BrandSectionProps) => {
  // Skip brands with less than 4 products
  if (products.length === 0 || products.length <= 4) return null;

  const gradient = BRAND_GRADIENTS[brand.name] ?? DEFAULT_GRADIENT;
  const collectionUrl = `/collection?brand=${brand.id}`;

  return (
    <div className="w-full py-10">
      {/* Section header */}
      <div className="flex items-end justify-end mb-6">
        <Link
          href={collectionUrl}
          className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Brand banner — gradient + subtle product montage */}
      <div
        className="relative w-full h-44 sm:h-56 rounded-2xl overflow-hidden mb-8"
        style={{
          background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
        }}
      >
        {/* Decorative large circle blur for depth */}
        <div
          className="absolute -right-16 -top-16 h-72 w-72 rounded-full opacity-20"
          style={{ background: gradient.to, filter: 'blur(48px)' }}
        />

        {/* Left: brand name + CTA */}
        <div className="relative z-10 flex h-full flex-col justify-center px-8 gap-4 max-w-xs">
          <p className="font-prata text-3xl sm:text-4xl font-medium text-white">
            {brand.name}
          </p>
          <p className="mt-1 text-sm text-secondary">
            {brand.product_count} products available
          </p>
          <Link
            href={collectionUrl}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-white/20 backdrop-blur-sm
                       border border-white/30 px-5 py-2 text-sm font-semibold text-white
                       hover:bg-white/30 transition-colors duration-200"
          >
            Shop {brand.name} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Right: first product image faded into the gradient */}
        {products[0]?.image_urls?.[0] && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2 h-40 w-40 sm:h-48 sm:w-48">
            <Image
              src={products[0].image_urls[0]}
              alt={products[0].name}
              fill
              className="object-contain drop-shadow-2xl"
              sizes="192px"
            />
            {/* Fade the image into the gradient on the left edge */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to right, ${gradient.from} 0%, transparent 40%)`,
              }}
            />
          </div>
        )}
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {products.map((product) => {
          return (
            <ProductItem key={product.id} product={product} />
          )
        })}
      </div>
    </div>
  );
};

export default BrandSection;