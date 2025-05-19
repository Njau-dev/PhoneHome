import React, { useState } from "react"
import Title from "./Title";
import { Truck, Award, Tag, Shield } from 'lucide-react';

const OurPolicy = () => {
  const [activePolicy, setActivePolicy] = useState(null);

  const policies = [
    {
      icon: <Truck className="w-16 h-16 text-accent" />,
      title: "Same-Day Delivery",
      description: "Same-day delivery for orders within Nairobi and free delivery for orders above Kshs 50k."
    },
    {
      icon: <Award className="w-16 h-16 text-accent" />,
      title: "Quality Services",
      description: "Quality after-sales services to ensure customer satisfaction."
    },
    {
      icon: <Tag className="w-16 h-16 text-accent" />,
      title: "Discounts & Offers",
      description: "For every first device you purchase you get a complimentary screen protector."
    },
    {
      icon: <Shield className="w-16 h-16 text-accent" />,
      title: "Product Warranty",
      description: "All our products come with manufacturer warranty and guarantee."
    }
  ];

  return (
    <div className="text-center sm:my-10 relative">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-12 h-12 rounded-full bg-accent opacity-10 animate-pulse delay:300  md:block"></div>
      <div className="absolute bottom-10 right-10 w-16 h-16 rounded-full bg-accent opacity-10 animate-pulse delay-300  md:block"></div>

      <div className='text-center text-[20px] sm:text-3xl py-8 animate-fade-in'>
        <Title text1={'WHY'} text2={'CHOOSE US'} />
        <p className='w-3/4 m-auto text-xs sm:text-base text-secondary'>Take a look at our company policies.</p>
      </div>

      <div className='grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 sm:px-4 sm:py-12 text-center text-primary w-11/12 md:w-4/5 mx-auto'>
        {policies.map((policy, index) => (
          <div
            key={index}
            className={`flex flex-col items-center p-4 rounded-xl transition-all duration-300 transform ${activePolicy === index ? 'scale-105 bg-black/5' : 'hover:scale-102'
              }`}
            onMouseEnter={() => setActivePolicy(index)}
            onMouseLeave={() => setActivePolicy(null)}
          >
            <div className={`mb-5 transition-all duration-300 ${activePolicy === index ? 'scale-110 transform-gpu' : 'hover:scale-110'
              }`}>
              {React.cloneElement(policy.icon, {
                className: `w-16 h-16 ${activePolicy === index ? 'text-primary' : 'text-accent'} transition-colors duration-300`
              })}
            </div>
            <p className={`font-semibold text-base md:text-lg lg:text-xl my-3 transition-colors duration-300 ${activePolicy === index ? 'text-accent' : ''
              }`}>
              {policy.title}
            </p>
            <p className='font-extralight text-sm md:text-base'>
              {policy.description}
            </p>

            {/* Add animated underline effect on hover */}
            <div className={`mt-4 w-0 h-0.5 bg-accent transition-all duration-300 ${activePolicy === index ? 'w-1/2' : ''
              }`}></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OurPolicy