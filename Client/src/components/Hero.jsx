import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Hero = () => {
  const slides = [
    {
      image: '/assets/images/hero/galaxy-s25-ultra-hero-3.jpg',
      title: 'Latest Arrivals',
      subtitle: 'OUR BESTSELLERS',
      cta: 'SHOP NOW'
    },
    {
      image: '/assets/images/hero/galaxy-s25-ultra-category.jpg',
      title: 'New Collection',
      subtitle: 'PREMIUM PHONES',
      cta: 'EXPLORE NOW'
    },
    {
      image: '/assets/images/hero/Apple_MacBook_Air_13.jpg',
      title: 'Limited Edition',
      subtitle: 'EXCLUSIVE DEVICES',
      cta: 'DISCOVER MORE'
    },
    {
      image: '/assets/images/hero/oraimo_banner.jpg',
      title: 'Special Offers',
      subtitle: 'SEASONAL DEALS',
      cta: 'VIEW DEALS'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [currentIndex]);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prevIndex) => (prevIndex === slides.length - 1 ? 0 : prevIndex + 1));
    setTimeout(() => setIsAnimating(false), 500); // Match this with your transition duration
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? slides.length - 1 : prevIndex - 1));
    setTimeout(() => setIsAnimating(false), 500); // Match this with your transition duration
  };

  const goToSlide = (index) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 500); // Match this with your transition duration
  };

  return (
    <div className='relative overflow-hidden border border-border'>
      <div className='flex flex-col sm:flex-row sm:h-[500px] lg:h-[600px]'>
        {/* Left side */}
        <div className='w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0 z-10'>
          <div
            className='text-border transition-opacity duration-500'
            style={{ opacity: isAnimating ? 0.5 : 1 }}
          >
            <div className='flex items-center gap-2'>
              <p className='w-8 md:w-11 h-[2px] bg-primary'></p>
              <p className='font-medium text-sm md:text-lg'>{slides[currentIndex].subtitle}</p>
            </div>
            <h1 className='prata-regular text-3xl sm:py-3 lg:text-5xl leading-relaxed text-primary'>{slides[currentIndex].title}</h1>
            <div className='flex items-center gap-2'>
              <p className='font-semibold text-sm md:text-lg'>{slides[currentIndex].cta}</p>
              <p className='w-8 md:w-11 h-[2px] bg-primary'></p>
            </div>
          </div>
        </div>

        {/* Right image holder with transition */}
        <div className='w-full sm:w-1/2 relative overflow-hidden h-64 sm:h-auto'>
          {slides.map((slide, index) => (
            <div
              key={index}
              className='absolute inset-0 transition-all duration-500 ease-in-out'
              style={{
                opacity: index === currentIndex ? 1 : 0,
                transform: `translateX(${(index - currentIndex) * 100}%)`,
              }}
            >
              <img
                src={slide.image}
                className='w-full h-full object-cover'
                alt={slide.title}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className='absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between px-4 z-20'>
        <button
          onClick={prevSlide}
          className='bg-black/30 hover:bg-black/50 text-primary p-2 rounded-full transition-colors'
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={nextSlide}
          className='bg-black/30 hover:bg-black/50 text-primary p-2 rounded-full transition-colors'
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Dots navigation */}
      <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20'>
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
              ? 'bg-accent w-6'
              : 'bg-secondary hover:bg-accent'
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Hero;