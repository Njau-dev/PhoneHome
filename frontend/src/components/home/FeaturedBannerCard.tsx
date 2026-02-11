'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FeaturedBanner } from '@/lib/types/home';

interface FeaturedBannerCardProps {
    banner: FeaturedBanner;
}

const FeaturedBannerCard = ({ banner }: FeaturedBannerCardProps) => {
    const isLarge = banner.size === 'large';

    return (
        <Link
            href={banner.ctaLink}
            className={`
        group relative overflow-hidden rounded-2xl 
        transition-transform duration-300 hover:scale-[1.02]
        ${isLarge ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'}
      `}
            style={{
                backgroundColor: banner.backgroundColor,
            }}
        >
            <div
                className={`
          relative h-full w-full
          ${isLarge ? 'min-h-100' : 'min-h-47.5'}
        `}
            >
                {/* Content Section */}
                <div
                    className={`
            absolute z-10 flex flex-col
            ${isLarge
                            ? 'left-8 top-8 max-w-md space-y-4'
                            : 'left-6 top-6 space-y-2'
                        }
          `}
                    style={{ color: banner.textColor || 'var(--text-primary)' }}
                >
                    {/* Title */}
                    <div>
                        {banner.title && (
                            <h3
                                className={`
                  font-prata font-medium leading-tight
                  ${isLarge ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'}
                `}
                            >
                                {banner.title}
                            </h3>
                        )}
                        {banner.subtitle && (
                            <p
                                className={`
                  font-prata font-medium leading-tight
                  ${isLarge ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'}
                `}
                            >
                                {banner.subtitle}
                            </p>
                        )}
                    </div>

                    {/* Description - Only for large banners */}
                    {isLarge && banner.description && (
                        <p className="text-sm leading-relaxed opacity-90 max-w-sm">
                            {banner.description}
                        </p>
                    )}

                    {/* CTA Button */}
                    <button
                        className={`
              group/btn inline-flex items-center gap-2 self-start
              rounded-lg px-6 py-2.5 font-medium
              transition-all duration-300
              ${isLarge
                                ? 'bg-white/90 text-gray-900 hover:bg-white'
                                : 'border-2 border-current hover:bg-white/10'
                            }
            `}
                    >
                        <span className={isLarge ? 'text-sm' : 'text-xs'}>
                            {banner.cta}
                        </span>
                        <svg
                            className="h-4 w-4 transition-transform group-hover/btn:translate-x-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                        </svg>
                    </button>
                </div>

                {/* Product Image */}
                <div
                    className={`
            absolute
            ${isLarge
                            ? 'right-8 top-1/2 h-72 w-72 -translate-y-1/2'
                            : 'bottom-4 right-4 h-32 w-32'
                        }
          `}
                >
                    <div className="relative h-full w-full">
                        <Image
                            src={banner.image}
                            alt={banner.title}
                            fill
                            className="object-contain transition-transform duration-300 group-hover:scale-110"
                            sizes={isLarge ? '(max-width: 768px) 100vw, 300px' : '128px'}
                        />
                    </div>
                </div>

                {/* Carousel Dots - Only for large banner */}
                {isLarge && (
                    <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
                        <div className="h-2 w-2 rounded-full bg-white"></div>
                        <div className="h-2 w-2 rounded-full bg-white/40"></div>
                        <div className="h-2 w-2 rounded-full bg-white/40"></div>
                    </div>
                )}
            </div>
        </Link>
    );
};

export default FeaturedBannerCard;