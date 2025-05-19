import React from 'react';
import { BatteryFull, Headphones, TabletSmartphone } from 'lucide-react';
import { FaApple, FaMicrosoft } from 'react-icons/fa';
import { SiSamsung, SiXiaomi, SiOppo, SiVivo, SiOneplus, SiHuawei, SiJbl, SiSony, SiLenovo, SiDell, SiHp } from 'react-icons/si';

const BrandMarquee = () => {
    const brands = [
        { name: 'Samsung', icon: <SiSamsung className="w-6 h-6 sm:w-8 sm:h-8 text-primary" /> },
        { name: 'Apple', icon: <FaApple className="w-6 h-6 sm:w-8 sm:h-8 text-primary" /> },
        { name: 'Xiaomi', icon: <SiXiaomi className="w-6 h-6 sm:w-8 sm:h-8 text-primary" /> },
        { name: 'Oppo', icon: <SiOppo className="w-6 h-6 sm:w-8 sm:h-8 text-primary" /> },
        { name: 'Vivo', icon: <SiVivo className="w-6 h-6 sm:w-8 sm:h-8 text-primary" /> },
        { name: 'OnePlus', icon: <SiOneplus className="w-6 h-6 sm:w-8 sm:h-8 text-primary" /> },
        { name: 'Huawei', icon: <SiHuawei className="w-6 h-6 sm:w-8 sm:h-8 text-primary" /> },
        { name: 'Lenovo', icon: <SiLenovo className="w-6 h-6 sm:w-8 sm:h-8 text-primary" /> },
        { name: 'HP', icon: <SiHp className="w-6 h-6 sm:w-8 sm:h-8 text-primary" /> },
        { name: 'Dell', icon: <SiDell className="w-6 h-6 sm:w-8 sm:h-8 text-primary" /> },
        { name: 'Oraimo', icon: <BatteryFull className="w-6 h-6 sm:w-8 sm:h-8 text-primary" /> },
        { name: 'JBL', icon: <SiJbl className="w-6 h-6 sm:w-8 sm:h-8 text-primary" /> },
        { name: 'Sony', icon: <SiSony className="w-6 h-6 sm:w-8 sm:h-8 text-primary" /> },
        { name: 'Microsoft', icon: <FaMicrosoft className="w-6 h-6 sm:w-8 sm:h-8 text-primary" /> },
        { name: 'Accessories', icon: <Headphones className="w-6 h-6 sm:w-8 sm:h-8 text-primary" /> },
        { name: 'Tablets', icon: <TabletSmartphone className="w-6 h-6 sm:w-8 sm:h-8 text-primary" /> },
    ];

    return (
        <div className="w-full bg-bgdark py-5 sm:py-8 overflow-hidden border-y border-border">
            {/* Marquee Container */}
            <div className="relative flex overflow-x-hidden">
                {/* First Marquee Set */}
                <div className="animate-marquee whitespace-nowrap flex items-center py-2 sm:py-4">
                    {brands.map((brand, index) => (
                        <div
                            key={`${brand.name}-1-${index}`}
                            className="mx-4 sm:mx-8 flex flex-col items-center justify-center gap-2 hover:text-accent transition-colors duration-300 group"
                        >
                            <div className="p-2 sm:p-3 bg-bgdark/10 rounded-full border border-border group-hover:border-accent">
                                {brand.icon}
                            </div>
                            <span className="text-xs sm:text-sm text-primary/80 group-hover:text-accent transition-colors duration-300">
                                {brand.name}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Duplicate Set for Seamless Loop */}
                <div className="absolute animate-marquee2 whitespace-nowrap flex items-center py-2 sm:py-4">
                    {brands.map((brand, index) => (
                        <div
                            key={`${brand.name}-2-${index}`}
                            className="mx-4 sm:mx-8 flex flex-col items-center justify-center gap-2 hover:text-accent transition-colors duration-300 group"
                        >
                            <div className="p-2 sm:p-3 bg-bgdark/10 rounded-full border border-border group-hover:border-accent">
                                {brand.icon}
                            </div>
                            <span className="text-xs sm:text-sm text-primary/80 group-hover:text-accent transition-colors duration-300">
                                {brand.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BrandMarquee;