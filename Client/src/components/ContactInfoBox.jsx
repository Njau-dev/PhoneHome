import React from 'react'
import { Phone, Mail, Instagram, Facebook, Twitter } from 'lucide-react'
import Logo from '/src/assets/logo.png'

const ContactInfoBox = () => {
    return (
        <div className="max-w-6xl mx-auto bg-bgdark my-20">
            <div className="flex flex-col md:flex-row gap-16 items-center border border-border rounded-xl p-8 md:p-12">
                {/* Left side - Logo */}
                <div className="md:w-1/2 flex justify-center">
                    <div className="relative">
                        {/* Decorative elements */}
                        <div className="absolute -top-6 -right-6 w-12 h-12 rounded-full bg-accent opacity-20 animate-pulse delay-300"></div>
                        <div className="absolute -bottom-4 -left-4 w-8 h-8 rounded-full bg-accent opacity-20 animate-pulse delay-300"></div>

                        {/* Logo placeholder */}
                        <div className="bg-black/20 rounded-xl p-6 relative z-10 border border-border flex items-center justify-center">
                            {/* <div className="text-accent text-4xl font-bold">
                                LOGO
                            </div> */}
                            <img src={Logo} alt="" />
                        </div>
                    </div>
                </div>

                {/* Right side - Contact Information */}
                <div className="md:w-1/2">
                    <div className="mb-6">
                        <h3 className="text-xl font-medium mb-4">Contact Information</h3>
                        <p className="text-secondary">
                            We're here to assist you. Feel free to reach out through any of the following channels.
                        </p>
                    </div>

                    {/* Phone Numbers */}
                    <div className="mb-4">
                        <div className="flex items-center mb-2">
                            <Phone className="h-5 w-5 text-accent mr-3" />
                            <span className="text-primary">+254 701 688 957</span>
                        </div>
                        <div className="flex items-center mb-2">
                            <Phone className="h-5 w-5 text-accent mr-3" />
                            <span className="text-primary">+254 723 503 101</span>
                        </div>
                        <div className="flex items-center">
                            <Phone className="h-5 w-5 text-accent mr-3" />
                            <span className="text-primary">+254 705 984 048</span>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center mb-6">
                        <Mail className="h-5 w-5 text-accent mr-3" />
                        <span className="text-primary">contact@yourcompany.com</span>
                    </div>

                    {/* Social Links */}
                    <div className="flex space-x-4">
                        <a
                            href="https://instagram.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-secondary hover:text-accent transition duration-300"
                        >
                            <Instagram size={24} />
                        </a>
                        <a
                            href="https://facebook.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-secondary hover:text-accent transition duration-300"
                        >
                            <Facebook size={24} />
                        </a>
                        <a
                            href="https://x.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-secondary hover:text-accent transition duration-300"
                        >
                            <Twitter size={24} />
                        </a>
                    </div>

                    <p className="text-xs text-secondary mt-6">
                        Located in the heart of Nairobi, Kenya. We're committed to serving you.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ContactInfoBox