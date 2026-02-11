"use client";

import React from "react"

import { useState, useEffect, useCallback } from "react";
import { Search, CreditCard, Truck, Package } from "lucide-react";
import Title from "@/components/common/Title";
import { cn } from "@/lib/utils/cn";

interface ProcessStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const processSteps: ProcessStep[] = [
  {
    icon: <Search className="h-6 w-6" />,
    title: "Browse & Select",
    description:
      "Explore our wide range of products and add your favorites to cart.",
  },
  {
    icon: <CreditCard className="h-6 w-6" />,
    title: "Easy Checkout",
    description:
      "Secure payment options with a simple, fast checkout process.",
  },
  {
    icon: <Truck className="h-6 w-6" />,
    title: "Fast Shipping",
    description:
      "Quick delivery with real-time tracking of your purchase.",
  },
  {
    icon: <Package className="h-6 w-6" />,
    title: "Unbox Your Product",
    description:
      "Unbox your new tech with our hassle-free warranty policy.",
  },
];

const ShoppingProcessSection = () => {
  const [activeStep, setActiveStep] = useState(0);

  const advanceStep = useCallback(() => {
    setActiveStep((prev) => (prev + 1) % processSteps.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(advanceStep, 3000);
    return () => clearInterval(interval);
  }, [advanceStep]);

  return (
    <section className="w-full py-16">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-4">
          <Title text1="How It" text2="Works" />
          <p className="mb-12 max-w-lg text-sm leading-relaxed text-secondary">
            Shop with confidence using our streamlined shopping experience
          </p>
        </div>

        {/* Steps Grid */}
        <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Connection line (desktop only) */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-16 hidden h-0.5 lg:block"
            aria-hidden="true"
          >
            <div className="mx-auto h-full w-[calc(100%-8rem)] bg-border" />
          </div>

          {processSteps.map((step, index) => {
            const isActive = activeStep === index;
            const isCompleted = index < activeStep;

            return (
              <button
                key={step.title}
                type="button"
                onClick={() => setActiveStep(index)}
                className={cn(
                  "group relative flex flex-col items-center rounded-2xl border p-8 text-center transition-all duration-300",
                  isActive
                    ? "border-muted/20 bg-bg shadow-lg shadow-muted/5"
                    : "border-transparent bg-transparent hover:border-border hover:bg-card/50"
                )}
              >
                {/* Step number badge */}
                <span
                  className={cn(
                    "absolute -top-7 left-34 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300",
                    isActive
                      ? "bg-accent text-bg"
                      : isCompleted
                        ? "text-secondary/80"
                        : "bg-muted text-bg"
                  )}
                >
                  {index + 1}
                </span>

                {/* Icon */}
                <div
                  className={cn(
                    "relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-300",
                    isActive
                      ? "bg-accent text-bg rounded-full"
                      : "bg-muted/80 text-primary/70 group-hover:bg-accent group-hover:text-bg"
                  )}
                >
                  {step.icon}
                </div>

                {/* Title */}
                <h3
                  className={cn(
                    "mb-2 text-base font-semibold transition-colors duration-300",
                    isActive ? "text-accent" : "text-primary"
                  )}
                >
                  {step.title}
                </h3>

                {/* Description */}
                <p
                  className={cn(
                    "text-sm leading-relaxed transition-colors duration-300",
                    isActive
                      ? "text-primary"
                      : "text-muted"
                  )}
                >
                  {step.description}
                </p>

                {/* Active indicator bar */}
                <div
                  className={cn(
                    "mt-5 h-1 rounded-full transition-all duration-500",
                    isActive ? "w-10 bg-muted" : "w-0 bg-transparent"
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ShoppingProcessSection;
