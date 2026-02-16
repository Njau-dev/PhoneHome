import Link from "next/link";
import Image from "next/image";

const ShopFooter = () => {
    return (
        <footer className="text-nav-text">
            <div className="grid gap-10 py-12 text-sm md:grid-cols-[2fr_1fr_1fr]">
                <div>
                    <Image
                        src="/assets/logo.png"
                        className="mb-4 w-32 h-auto"
                        alt="Logo"
                        width={128}
                        height={48}
                    />
                    <p className="max-w-md text-nav-muted">
                        Phone Home is a Nairobi-based store focused on premium phones,
                        tablets, laptops, audio devices, and dependable customer support
                        across Kenya.
                    </p>
                </div>

                <div>
                    <p className="mb-4 text-base font-semibold">PHONE HOME</p>
                    <ul className="space-y-2 text-nav-muted">
                        <li>
                            <Link href="/" className="hover:text-accent">
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link href="/collection" className="hover:text-accent">
                                Collection
                            </Link>
                        </li>
                        <li>
                            <Link href="/contact" className="hover:text-accent">
                                Contact
                            </Link>
                        </li>
                        <li>
                            <Link href="/privacy" className="hover:text-accent">
                                Privacy Policy
                            </Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <p className="mb-4 text-base font-semibold">GET IN TOUCH</p>
                    <ul className="space-y-2 text-nav-muted">
                        <li>
                            <Link href="tel:+254701688957" className="hover:text-accent">
                                +254-701-688957
                            </Link>
                        </li>
                        <li>
                            <Link href="tel:+254705984048" className="hover:text-accent">
                                +254-705-984048
                            </Link>
                        </li>
                        <li>
                            <Link href="tel:+254723503101" className="hover:text-accent">
                                +254-723-503101
                            </Link>
                        </li>
                        <li>
                            <Link href="mailto:phonehome@kenya.com" className="hover:text-accent">
                                phonehome@kenya.com
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-nav-border py-4 text-center text-xs text-nav-muted">
                Copyright 2026 @ phonehome.co.ke - All Rights Reserved
            </div>
        </footer>
    );
};

export default ShopFooter;
