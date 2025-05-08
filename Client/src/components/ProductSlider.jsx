import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ProductSlider = ({
    title,
    subtitle,
    products,
    renderProduct,
    className = "",
    slidesToShow = { xs: 2, sm: 3, md: 4, lg: 5 },
    gap = 4,
    maxRows = 2
}) => {
    const sliderRef = useRef(null);
    const [position, setPosition] = useState(0);
    const [showControls, setShowControls] = useState(false);
    const [sliderWidth, setSliderWidth] = useState(0);
    const [itemWidth, setItemWidth] = useState(0);
    const [totalSlides, setTotalSlides] = useState(0);

    // Determine number of slides based on screen size
    useEffect(() => {
        const handleResize = () => {
            if (!sliderRef.current) return;

            const containerWidth = sliderRef.current.clientWidth;
            setSliderWidth(containerWidth);

            let visibleSlides;
            if (window.innerWidth < 640) {
                visibleSlides = slidesToShow.xs;
            } else if (window.innerWidth < 768) {
                visibleSlides = slidesToShow.sm;
            } else if (window.innerWidth < 1024) {
                visibleSlides = slidesToShow.md;
            } else {
                visibleSlides = slidesToShow.lg;
            }

            // Calculate width for each item including gap
            const gapSize = 16 * gap; // Convert Tailwind gap to pixels (approximation)
            const totalGapWidth = gapSize * (visibleSlides - 1);
            const width = (containerWidth - totalGapWidth) / visibleSlides;

            setItemWidth(width);
            setTotalSlides(visibleSlides);

            // Check if we need to show controls (only if products exceed visible slides)
            setShowControls(products.length > visibleSlides * maxRows);
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [products.length, slidesToShow, gap, maxRows]);

    // Reset position when window resizes
    useEffect(() => {
        setPosition(0);
    }, [sliderWidth, itemWidth]);

    const handlePrev = () => {
        const newPosition = Math.min(position + itemWidth * totalSlides, 0);
        setPosition(newPosition);
    };

    const handleNext = () => {
        const maxScroll = -(itemWidth * (products.length - totalSlides * maxRows));
        const newPosition = Math.max(position - itemWidth * totalSlides, maxScroll);
        setPosition(newPosition);
    };

    return (
        <div className={`w-full ${className}`}>
            {/* Title Section */}
            {title && (
                <div className="text-center py-8">
                    <h2 className="text-3xl mb-2">{title}</h2>
                    {subtitle && <p className="w-3/4 mx-auto text-sm sm:text-base">{subtitle}</p>}
                </div>
            )}

            {/* Slider Container */}
            <div className="relative">
                {/* Navigation Buttons */}
                {showControls && (
                    <>
                        <button
                            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-md transition-opacity duration-300 ${position >= 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-70'}`}
                            onClick={handlePrev}
                            disabled={position >= 0}
                            aria-label="Previous products"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>

                        <button
                            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-md transition-opacity duration-300 ${position <= -(itemWidth * (products.length - totalSlides * maxRows)) ? 'opacity-30 cursor-not-allowed' : 'opacity-70'}`}
                            onClick={handleNext}
                            disabled={position <= -(itemWidth * (products.length - totalSlides * maxRows))}
                            aria-label="Next products"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </>
                )}

                {/* Slider Track */}
                <div
                    ref={sliderRef}
                    className="overflow-hidden"
                >
                    <div
                        className="flex flex-wrap md:flex-nowrap md:transform transition-transform duration-300 ease-in-out"
                        style={{
                            transform: `translateX(${position}px)`,
                            gap: `${gap * 0.25}rem`,
                            marginLeft: showControls ? "2rem" : "0",
                            marginRight: showControls ? "2rem" : "0",
                        }}
                    >
                        {products.map((product, index) => (
                            <div
                                key={index}
                                className="flex-shrink-0"
                                style={{
                                    width: `${itemWidth}px`,
                                    // For mobile: 2-column grid
                                    flexBasis: `calc(50% - ${gap * 0.25}rem)`,
                                    // For tablet+: single row with fixed width
                                    "@media (min-width: 768px)": {
                                        flexBasis: "auto"
                                    }
                                }}
                            >
                                {renderProduct(product, index)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductSlider;