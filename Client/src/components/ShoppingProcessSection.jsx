import { useState, useEffect } from "react";
import { Truck, Search, CreditCard, Package } from "lucide-react";
import Title from "./Title";

const ShoppingProcessSection = () => {
    const [activeStep, setActiveStep] = useState(0);

    // Auto-cycle through steps every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % processSteps.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const processSteps = [
        {
            icon: <Search className="w-12 h-12 text-primary" />,
            title: "Browse & Select",
            description: "Explore our wide range of products and add your favorites to cart."
        },
        {
            icon: <CreditCard className="w-12 h-12 text-primary" />,
            title: "Easy Checkout",
            description: "Secure payment options with a simple, fast checkout process."
        },
        {
            icon: <Truck className="w-12 h-12 text-primary" />,
            title: "Fast Shipping",
            description: "Quick delivery with real-time tracking of your purchase."
        },
        {
            icon: <Package className="w-12 h-12 text-primary" />,
            title: "Unbox Your Product",
            description: "Unbox your new tech with our hassle-free warranty policy."
        }
    ];

    return (
        <div className="w-full bg-bgdark py-8 sm:py-16 my-6 sm:my-10 relative overflow-hidden">
            {/* SVG Pattern Background stays the same */}

            <div className="container mx-auto px-2 sm:px-4 relative z-10">
                <div className='text-center text-[20px] sm:text-3xl py-6 sm:py-8'>
                    <Title text1={"SHOPPING"} text2={"PROCESS"} />
                    <p className='w-3/4 m-auto text-xs sm:text-base text-secondary'>
                        Shop with confidence using our streamlined shopping experience
                    </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 relative">
                    {/* Connection Line */}
                    <div className="hidden lg:block absolute top-1/2 left-0 w-full h-1 bg-border -z-10"></div>

                    {processSteps.map((step, index) => (
                        <div
                            key={index}
                            className={`flex flex-col items-center p-3 sm:p-6 rounded-lg bg-gradient-to-br from-bgdark to-black shadow-lg transform transition-all duration-500 ${activeStep === index
                                ? "scale-105 shadow-xl"
                                : "scale-100 opacity-80"
                                }`}
                            onMouseEnter={() => setActiveStep(index)}
                        >
                            <div className="relative mb-3 sm:mb-6">
                                {/* Step Number */}
                                <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-accent flex items-center justify-center text-bgdark font-bold shadow-md text-xs sm:text-base">
                                    {index + 1}
                                </div>

                                {/* Icon Container */}
                                <div
                                    className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center bg-bgdark bg-gradient-to-br from-accent transition-all duration-500 ${activeStep === index ? "shadow-lg shadow-accent/30" : ""
                                        }`}
                                >
                                    {/* Adjust icon size */}
                                    <div className="size-1/2 sm:size-3/4 flex items-center justify-center">
                                        {step.icon}
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-center text-sm sm:text-lg lg:text-xl font-semibold text-primary mb-2 sm:mb-3">
                                {step.title}
                            </h3>

                            <p className="text-secondary text-center text-xs sm:text-sm">
                                {step.description}
                            </p>

                            {/* Animated Underline */}
                            <div
                                className={`mt-2 sm:mt-4 h-1 bg-accent rounded-full transition-all duration-500 ${activeStep === index ? "w-10 sm:w-16" : "w-0"
                                    }`}
                            ></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ShoppingProcessSection;