"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";
import Title from "./Title";

const NewsLetterBox = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto sm:my-20">
      <div className="text-center text-2xl sm:text-3xl py-8">
        <Title text1="NEWSLETTER" text2="UPDATES" />
        <p className="w-3/4 m-auto text-xs sm:text-base text-secondary">
          Subscribe to receive exclusive offers and the latest news directly in your
          inbox.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-center border border-border rounded-xl p-6 sm:p-8 md:p-12 bg-bg-card">
        {/* Form */}
        <div className="md:w-1/2">
          <p className="text-secondary text-sm mb-6">
            Stay updated with the latest products, special offers, and helpful tips
            for your devices
          </p>

          <form onSubmit={handleSubscribe} className="relative">
            <div className="flex items-center rounded-full overflow-hidden p-1 pl-4 border border-border">
              <Mail className="size-9 text-secondary mr-2" />
              <input
                type="email"
                placeholder="Enter your email address"
                className="bg-transparent border-none w-full focus:outline-none text-sm text-primary placeholder:text-secondary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-accent hover:bg-bg hover:text-accent border border-transparent hover:border-accent text-bg font-medium py-2 sm:py-3 px-4 sm:px-8 rounded-full transition duration-300 flex items-center ml-2"
              >
                {subscribed ? "Subscribed!" : "Subscribe"}
                {!subscribed && <Send size={16} className="ml-2" />}
              </button>
            </div>

            {subscribed && (
              <div className="text-success text-sm flex items-center mt-4">
                <svg
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Thank you for subscribing!
              </div>
            )}
          </form>
          <p className="text-xs text-secondary mt-8">
            By subscribing, you agree to our Privacy Policy and consent to receive
            updates from our company.
          </p>
        </div>

        {/* Illustration */}
        <div className="md:w-1/2 flex justify-center">
          <div className="relative">
            <div className="absolute -top-6 -right-6 w-12 h-12 rounded-full bg-accent opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-8 h-8 rounded-full bg-accent opacity-20 animate-pulse"></div>

            <div className="bg-bg rounded-xl p-6 relative z-10 border border-border">
              <div className="flex flex-col items-center text-center">
                <Mail size={48} className="text-accent mb-4" />
                <h4 className="text-lg font-medium mb-2">Weekly Updates</h4>
                <p className="text-sm text-secondary mb-4">
                  Get the latest product offers, discounts, and tech maintenance tips
                </p>
                <div className="flex gap-2">
                  <span className="bg-bg text-accent text-xs py-1 px-2 rounded-full">
                    Tips
                  </span>
                  <span className="bg-bg text-accent text-xs py-1 px-2 rounded-full">
                    Offers
                  </span>
                  <span className="bg-bg text-accent text-xs py-1 px-2 rounded-full">
                    News
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default NewsLetterBox;
