import { Phone, Mail, Instagram, Facebook, Twitter } from "lucide-react";

const ContactInfoBox = () => {
  return (
    <div className="max-w-6xl mx-auto my-10 sm:my-20">
      <div className="flex flex-col md:flex-row gap-12 sm:gap-16 items-center border border-border rounded-xl p-8 md:p-12 bg-bg-card">
        {/* Logo */}
        <div className="md:w-1/2 flex justify-center">
          <div className="relative">
            <div className="absolute -top-6 -right-6 w-12 h-12 rounded-full bg-accent opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-8 h-8 rounded-full bg-accent opacity-20 animate-pulse"></div>

            <div className="bg-bg rounded-xl p-6 relative z-10 border border-border flex items-center justify-center">
              <img src="/assets/logo.png" alt="Phone Home Kenya" />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="md:w-1/2">
          <div className="mb-6">
            <h3 className="text-lg sm:text-xl font-medium mb-4">
              Contact Information
            </h3>
            <p className="text-secondary text-sm sm:text-base">
              We're here to assist you. Feel free to reach out through any of the
              following channels.
            </p>
          </div>

          {/* Phone Numbers */}
          <div className="mb-4 space-y-2">
            <a href="tel:+254701688957" className="flex items-center hover:text-accent transition-colors">
              <Phone className="h-5 w-5 text-accent mr-3" />
              <span>+254 701 688 957</span>
            </a>
            <a href="tel:+254723503101" className="flex items-center hover:text-accent transition-colors">
              <Phone className="h-5 w-5 text-accent mr-3" />
              <span>+254 723 503 101</span>
            </a>
            <a href="tel:+254705984048" className="flex items-center hover:text-accent transition-colors">
              <Phone className="h-5 w-5 text-accent mr-3" />
              <span>+254 705 984 048</span>
            </a>
          </div>

          {/* Email */}
          <a href="mailto:phonehome@kenya.com" className="flex items-center mb-6 hover:text-accent transition-colors">
            <Mail className="h-5 w-5 text-accent mr-3" />
            <span>phonehome@kenya.com</span>
          </a>

          {/* Social Links */}
          <div className="flex space-x-4 mb-6">
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

          <p className="text-xs text-secondary">
            Located in the heart of Nairobi, Kenya. We're committed to serving you.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactInfoBox;
