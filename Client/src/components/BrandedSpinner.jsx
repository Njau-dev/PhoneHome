import React from 'react';
import logo from '../assets/logo.png';

const BrandedSpinner = ({ message = "Loading..." }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="relative">
                {/* Outer spinning ring */}
                <div className="w-24 h-24 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>

                {/* Inner spinning ring (opposite direction) */}
                <div className="absolute top-1 left-1 w-22 h-22 border-4 border-accent border-opacity-40 border-b-transparent rounded-full animate-spin-slow"></div>

                {/* Logo with pulsing effect */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 flex items-center justify-center">
                    <img
                        src={logo}
                        alt="Logo"
                        className="w-14 h-auto object-contain animate-pulse-subtle"
                    />
                </div>
            </div>
            <p className="mt-6 text-secondary font-medium">{message}</p>
        </div>
    );
};

export default BrandedSpinner;