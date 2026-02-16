"use client";

import React, { useState } from "react";
import { Truck, Award, Tag, Shield } from "lucide-react";
import Title from "@/components/common/Title";

interface Policy {
  icon: React.ReactElement<{ className?: string }>;
  title: string;
  description: string;
}

const policies: Policy[] = [
  {
    icon: <Truck className="w-10 h-10" />,
    title: "Same-Day Delivery",
    description:
      "Same-day delivery for orders within Nairobi and free delivery for orders above Kshs 50k.",
  },
  {
    icon: <Award className="w-10 h-10" />,
    title: "Quality Services",
    description:
      "Quality after-sales services to ensure customer satisfaction.",
  },
  {
    icon: <Tag className="w-10 h-10" />,
    title: "Discounts & Offers",
    description:
      "For every first device you purchase you get a complimentary screen protector.",
  },
  {
    icon: <Shield className="w-10 h-10" />,
    title: "Product Warranty",
    description:
      "All our products come with manufacturer warranty and guarantee.",
  },
];

const OurPolicy = () => {
  const [activePolicy, setActivePolicy] = useState<number | null>(null);

  return (
    <section className="w-full py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-10">
          <Title text1="WHY" text2="CHOOSE US" />
          <p className="max-w-md text-sm text-secondary sm:text-base">
            Take a look at our company policies.
          </p>
        </div>

        {/* Policy Cards */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
          {policies.map((policy, index) => {
            const isActive = activePolicy === index;

            return (
              <div
                key={index}
                className={`group relative flex flex-col items-center rounded-2xl border p-5 sm:p-7 text-center transition-all duration-300 ${isActive
                  ? "border-accent/60 bg-accent-light/40 shadow-md scale-[1.03]"
                  : "border-border-light bg-background-light hover:border-accent/40 hover:shadow-sm"
                  }`}
                onMouseEnter={() => setActivePolicy(index)}
                onMouseLeave={() => setActivePolicy(null)}
              >
                {/* Icon Container */}
                <div
                  className={`mb-4 flex h-16 w-16 items-center justify-center rounded-xl transition-all duration-300 ${isActive
                    ? "bg-accent text-background shadow-md"
                    : "bg-background-card text-accent"
                    }`}
                >
                  {React.cloneElement(policy.icon, {
                    className: `w-8 h-8 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-105"
                      }`,
                  })}
                </div>

                {/* Title */}
                <h3
                  className={`mb-2 text-sm font-semibold transition-colors duration-300 sm:text-base lg:text-lg ${isActive ? "text-accent" : "text-primary"
                    }`}
                >
                  {policy.title}
                </h3>

                {/* Description */}
                <p className="text-xs leading-relaxed text-secondary sm:text-sm">
                  {policy.description}
                </p>

                {/* Bottom Accent Bar */}
                <div
                  className={`mt-5 h-0.5 rounded-full bg-accent transition-all duration-300 ${isActive ? "w-12" : "w-0"
                    }`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default OurPolicy;
