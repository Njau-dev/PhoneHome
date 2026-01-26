import Link from "next/link";

const Footer = () => {
  return (
    <div>
      <div className="flex flex-col sm:grid grid-cols-[2fr_1fr_1fr] gap-14 sm:gap-4 mb-8 mt-12 sm:mt-12 md:mt-28 text-sm border-t-2 border-border sm:pt-7 sm:pl-2">
        <div>
          <img src="/assets/logo.png" className="my-5 w-32" alt="Logo" />
          <p className="w-full md:w-2/3 text-primary">
            Phone Home is a shop based in Nairobi, Kenya which focuses on
            delivering quality products namely Phones, Tablets, Laptops, Audio
            devices and services to their clients all over Kenya.
          </p>
        </div>

        <div>
          <p className="text-xl font-medium mb-5">PHONE HOME</p>
          <ul className="flex flex-col gap-2 text-primary">
            <li>
              <Link href="/" className="hover:text-accent transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="hover:text-accent transition-colors"
              >
                Contacts
              </Link>
            </li>
            <li>
              <Link
                href="/delivery"
                className="hover:text-accent transition-colors"
              >
                Delivery
              </Link>
            </li>
            <li>
              <Link
                href="/privacy"
                className="hover:text-accent transition-colors"
              >
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
          <ul className="flex flex-col gap-2 text-primary">
            <li>
              <Link
                href="tel:+254701688957"
                className="hover:text-accent transition-colors"
              >
                +254-701-688957
              </Link>
            </li>
            <li>
              <Link
                href="tel:+254705984048"
                className="hover:text-accent transition-colors"
              >
                +254-705-984048
              </Link>
            </li>
            <li>
              <Link
                href="tel:+254723503101"
                className="hover:text-accent transition-colors"
              >
                +254-723-503101
              </Link>
            </li>
            <li>
              <Link
                href="mailto:phonehome@kenya.com"
                className="hover:text-accent transition-colors"
              >
                phonehome@kenya.com
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div>
        <hr className="border-border" />
        <p className="py-5 text-sm text-center text-secondary font-light">
          Copyright 2024@ phonehome.co.ke - All Rights Reserved
        </p>
      </div>
    </div>
  );
};

export default Footer;
