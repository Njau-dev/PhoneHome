import Link from "next/link";
import Image from "next/image";

export default function CheckoutNavbar() {
    return (
        <header className="sticky top-0 z-40 py-4 text-nav-text">
            <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/assets/logo.png"
                        alt="Phone Home logo"
                        width={150}
                        height={48}
                        className="h-12 w-auto"
                    />
                </Link>
                <p className="text-sm font-medium text-accent">Secure Checkout</p>
            </div>
        </header>
    );
}
