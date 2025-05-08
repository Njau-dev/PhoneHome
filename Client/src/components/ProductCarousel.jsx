import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ProductCarousel = ({
    children,
    slidesToShow = slidesToShow,
    autoplay = true,
    autoplaySpeed = 3000,
    className,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const carouselRef = useRef(null);

    // Calculate how many slides to show based on screen width
    const [visibleSlides, setVisibleSlides] = useState(slidesToShow);

    // Track window size for responsiveness
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setVisibleSlides(2);
            } else if (window.innerWidth < 768) {
                setVisibleSlides(3);
            } else if (window.innerWidth < 1024) {
                setVisibleSlides(3);
            } else if (window.innerWidth < 1280) {
                setVisibleSlides(4);
            } else {
                setVisibleSlides(slidesToShow);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [slidesToShow]);

    // Set up autoplay if enabled
    useEffect(() => {
        let interval;

        if (autoplay) {
            interval = setInterval(() => {
                nextSlide();
            }, autoplaySpeed);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoplay, autoplaySpeed, currentIndex, children.length, visibleSlides]);

    const totalSlides = children.length;
    const maxIndex = Math.max(0, totalSlides - visibleSlides);

    const nextSlide = () => {
        setCurrentIndex(prevIndex =>
            prevIndex >= maxIndex ? 0 : prevIndex + 1
        );
    };

    const prevSlide = () => {
        setCurrentIndex(prevIndex =>
            prevIndex <= 0 ? maxIndex : prevIndex - 1
        );
    };

    const goToSlide = (index) => {
        setCurrentIndex(index > maxIndex ? maxIndex : index);
    };

    // Touch event handlers for mobile swipe
    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            nextSlide();
        } else if (isRightSwipe) {
            prevSlide();
        }

        setTouchStart(null);
        setTouchEnd(null);
    };

    const translateValue = -currentIndex * (100 / visibleSlides);
    const showNavigation = children.length > visibleSlides;
    const dotCount = Math.ceil(totalSlides / visibleSlides);

    return (
        <div className={`relative w-full overflow-hidden ${className || ''}`}>
            <div
                ref={carouselRef}
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(${translateValue}%)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {children.map((child, index) => (
                    <div
                        key={index}
                        className={`flex-shrink-0 w-full`}
                        style={{ width: `${100 / visibleSlides}%` }}
                    >
                        {child}
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            {showNavigation && (
                <>
                    <button
                        className="absolute left-0 top-[40%] -translate-y-[40%] bg-black/80 opacity-80 hover:bg-bgdark text-gray-800 p-2 rounded-full shadow-md z-10 transition-all transform hover:scale-110"
                        onClick={prevSlide}
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="h-6 w-6 text-accent" />
                    </button>

                    <button
                        className="absolute right-0 top-[40%] -translate-y-[40%] bg-black/80 hover:bg-bgdark text-gray-800 p-2 rounded-full shadow-md z-10 transition-all transform hover:scale-110"
                        onClick={nextSlide}
                        aria-label="Next slide"
                    >
                        <ChevronRight className="h-6 w-6 text-accent" />
                    </button>
                </>
            )}

            {/* Pagination Dots */}
            {showNavigation && (
                <div className="flex justify-center mt-4 gap-2">
                    {Array.from({ length: dotCount }).map((_, index) => (
                        <button
                            key={index}
                            className={`h-2 rounded-full transition-all ${index === Math.floor(currentIndex / visibleSlides)
                                ? "w-6 bg-accent"
                                : "w-2 bg-secondary hover:bg-bgdark"
                                }`}
                            onClick={() => goToSlide(index * visibleSlides)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductCarousel;
