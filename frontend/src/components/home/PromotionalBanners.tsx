'use client';

import Link from 'next/link';
import Image from 'next/image';

interface PromoBanner {
    id: string;
    title: string;
    subtitle: string;
    highlightText?: string;
    image: string;
    link: string;
    backgroundColor: string;
    textColor: string;
}

const PROMO_BANNERS: PromoBanner[] = [
    {
        id: '1',
        title: 'Discounts 50%',
        subtitle: 'On All Watches',
        image: '/images/promos/watches-promo.png',
        link: '/collection/watches',
        backgroundColor: '#1e3a5f',
        textColor: '#ffffff',
    },
    {
        id: '2',
        title: 'Mega Discounts',
        subtitle: '50% Off',
        highlightText: 'This Week',
        image: '/images/promos/airpods-promo.png',
        link: '/deals',
        backgroundColor: '#6b21a8',
        textColor: '#ffffff',
    },
];

const PromotionalBanners = () => {
    return (
        <section className="w-full px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {PROMO_BANNERS.map((banner) => (
                        <Link
                            key={banner.id}
                            href={banner.link}
                            className="group relative overflow-hidden rounded-2xl transition-transform duration-300 hover:scale-[1.02]"
                            style={{ backgroundColor: banner.backgroundColor }}
                        >
                            <div className="relative flex h-56 items-center p-8">
                                {/* Text Content */}
                                <div className="relative z-10 flex-1">
                                    <h3
                                        className="mb-2 font-prata text-3xl font-medium"
                                        style={{ color: banner.textColor }}
                                    >
                                        {banner.title}
                                    </h3>
                                    <p
                                        className="mb-4 text-xl"
                                        style={{ color: banner.textColor }}
                                    >
                                        {banner.subtitle}{' '}
                                        {banner.highlightText && (
                                            <span className="italic text-pink-400">
                                                {banner.highlightText}
                                            </span>
                                        )}
                                    </p>

                                    {/* CTA */}
                                    <div className="inline-flex items-center gap-2 border-b-2 border-current pb-1 text-sm font-medium transition-colors group-hover:border-transparent"
                                        style={{ color: banner.textColor }}
                                    >
                                        <span>Shop Now</span>
                                        <svg
                                            className="h-4 w-4 transition-transform group-hover:translate-x-1"
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
                                    </div>
                                </div>

                                {/* Product Image */}
                                <div className="relative h-full w-64">
                                    <Image
                                        src={banner.image}
                                        alt={banner.title}
                                        fill
                                        className="object-contain transition-transform duration-300 group-hover:scale-110"
                                        sizes="256px"
                                    />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PromotionalBanners;