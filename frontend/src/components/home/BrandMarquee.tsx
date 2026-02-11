'use client';

import { useRouter } from 'next/navigation';
import { BatteryFull, Headphones, TabletSmartphone } from 'lucide-react';
import { FaApple, FaMicrosoft } from 'react-icons/fa';
import {
    SiSamsung, SiXiaomi, SiOppo, SiVivo, SiOneplus,
    SiHuawei, SiJbl, SiSony, SiLenovo, SiDell, SiHp,
} from 'react-icons/si';
import { useHome } from '@/lib/hooks/useHome';

// Map brand name → icon element
const BRAND_ICONS: Record<string, React.ReactNode> = {
    Samsung: <SiSamsung className="w-6 h-6 sm:w-8 sm:h-8" />,
    Apple: <FaApple className="w-6 h-6 sm:w-8 sm:h-8" />,
    Xiaomi: <SiXiaomi className="w-6 h-6 sm:w-8 sm:h-8" />,
    Oppo: <SiOppo className="w-6 h-6 sm:w-8 sm:h-8" />,
    Vivo: <SiVivo className="w-6 h-6 sm:w-8 sm:h-8" />,
    OnePlus: <SiOneplus className="w-6 h-6 sm:w-8 sm:h-8" />,
    Huawei: <SiHuawei className="w-6 h-6 sm:w-8 sm:h-8" />,
    Lenovo: <SiLenovo className="w-6 h-6 sm:w-8 sm:h-8" />,
    HP: <SiHp className="w-6 h-6 sm:w-8 sm:h-8" />,
    Dell: <SiDell className="w-6 h-6 sm:w-8 sm:h-8" />,
    Oraimo: <BatteryFull className="w-6 h-6 sm:w-8 sm:h-8" />,
    JBL: <SiJbl className="w-6 h-6 sm:w-8 sm:h-8" />,
    Sony: <SiSony className="w-6 h-6 sm:w-8 sm:h-8" />,
    Microsoft: <FaMicrosoft className="w-6 h-6 sm:w-8 sm:h-8" />,
    Accessories: <Headphones className="w-6 h-6 sm:w-8 sm:h-8" />,
    Tablets: <TabletSmartphone className="w-6 h-6 sm:w-8 sm:h-8" />,
};

const BrandMarquee = () => {
    const router = useRouter();
    const { brands, isLoading } = useHome();

    const handleBrandClick = (brandId: number) => {
        router.push(`/collection?brand=${brandId}`);
    };

    if (isLoading) {
        return (
            <div className="w-full py-5 sm:py-8 border-y border-border bg-bg-light">
                <div className="flex items-center justify-center gap-8 opacity-40">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div className="h-12 w-12 rounded-full bg-border animate-pulse" />
                            <div className="h-3 w-14 rounded bg-border animate-pulse" />
                            <div className="h-2 w-10 rounded bg-border animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-bg-light py-5 sm:py-8 overflow-hidden border-y border-border">
            {/* Marquee container — identical structure to original */}
            <div className="relative flex overflow-x-hidden">

                {/* First marquee pass */}
                <div className="animate-marquee whitespace-nowrap flex items-center py-2 sm:py-4">
                    {brands.map((brand, index) => (
                        <button
                            key={`${brand.id}-1-${index}`}
                            onClick={() => handleBrandClick(brand.id)}
                            className="mx-4 sm:mx-8 flex flex-col items-center justify-center gap-1 hover:text-accent transition-colors duration-300 group"
                        >
                            <div
                                className="p-2 sm:p-3 rounded-full border border-border
                           text-primary
                           group-hover:border-accent group-hover:text-accent
                           transition-colors duration-300"
                            >
                                {BRAND_ICONS[brand.name] ?? <Headphones className="w-6 h-6 sm:w-8 sm:h-8" />}
                            </div>
                            <span className="text-xs sm:text-sm text-secondary group-hover:text-accent transition-colors duration-300">
                                {brand.name}
                            </span>
                            <span className="text-[10px] sm:text-xs text-muted">
                                {brand.product_count} {brand.product_count === 1 ? 'item' : 'items'}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Duplicate pass for seamless loop — identical to original pattern */}
                <div className="absolute animate-marquee2 whitespace-nowrap flex items-center py-2 sm:py-4">
                    {brands.map((brand, index) => (
                        <button
                            key={`${brand.id}-2-${index}`}
                            onClick={() => handleBrandClick(brand.id)}
                            className="mx-4 sm:mx-8 flex flex-col items-center justify-center gap-1 hover:text-accent transition-colors duration-300 group"
                        >
                            <div
                                className="p-2 sm:p-3 rounded-full border border-border
                           text-primary
                           group-hover:border-accent group-hover:text-accent
                           transition-colors duration-300"
                            >
                                {BRAND_ICONS[brand.name] ?? <Headphones className="w-6 h-6 sm:w-8 sm:h-8" />}
                            </div>
                            <span className="text-xs sm:text-sm text-secondary group-hover:text-accent transition-colors duration-300">
                                {brand.name}
                            </span>
                            <span className="text-[10px] sm:text-xs text-muted">
                                {brand.product_count} {brand.product_count === 1 ? 'item' : 'items'}
                            </span>
                        </button>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default BrandMarquee;
