'use client';

import Link from 'next/link';
import Image from 'next/image';
import BrandedSpinner from '@/components/common/BrandedSpinner';
import { Gift } from 'lucide-react';
import ProductItem from '../product/ProductItem';
import Title from '../common/Title';
import { useHome } from '@/lib/hooks/useHome';

const BestDeals = () => {
    const { bestDeals, isLoading } = useHome()

    if (isLoading) {
        return (
            <section className="w-full py-12">
                <div className="mx-auto max-w-7xl">
                    <h2 className="mb-8 text-3xl font-bold text-primary">
                        Best Deals
                    </h2>
                    <div className="flex min-h-100 items-center justify-center">
                        <BrandedSpinner />
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full py-12">
            <div className="mx-auto max-w-7xl">
                {/* Section Title */}
                <div className='mb-8'>
                    <Title text1='Best' text2='Deals' />
                </div>

                {/* Grid Layout */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Hot Deals Banner - Left Side */}
                    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#1e40af] to-[#7c3aed] p-8 lg:row-span-2">
                        <div className="relative z-10 flex h-full flex-col">
                            {/* Title */}
                            <div className="mb-4">
                                <h3 className="font-prata text-3xl font-medium text-white">
                                    Hot Deals
                                </h3>
                            </div>

                            {/* Description */}
                            <p className="mb-6 text-sm leading-relaxed text-white/90">
                                Pair text with an image to focus on your chosen product, collection, or blog post.
                            </p>

                            {/* CTA Button */}
                            <Link
                                href="/deals"
                                className="mb-8 inline-flex items-center gap-2 self-start rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-[#1e40af] transition-all hover:bg-white/90"
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
                            </Link>

                            {/* Featured Product Image */}
                            <div className="relative mt-auto h-64 w-full">
                                <Image
                                    src="/assets/images/phone-banner.png"
                                    alt="Hot Deal Product"
                                    fill
                                    className="object-contain"
                                    sizes="300px"
                                />
                            </div>
                        </div>
                    </div>

                    <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                        {/* Product Grid - Right Side */}
                        {bestDeals.map((product) => (
                            <ProductItem key={product.id} product={product} />
                        ))}
                    </div>
                </div>
                {/* Empty State */}
                {!isLoading && bestDeals.length === 0 && (
                    <div className="flex min-h-100 flex-col items-center justify-center text-center">
                        <Gift size={40} />
                        <h3 className="mb-2 text-lg font-semibold text-primary">
                            No deals available
                        </h3>
                        <p className="text-sm text-secondary">
                            Check back soon for amazing deals
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default BestDeals;