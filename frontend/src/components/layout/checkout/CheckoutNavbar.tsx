import Link from "next/link";

export default function CheckoutNavbar() {
    return (
        <header className="sticky top-0 z-40 py-4 text-nav-text">
            <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <img src="/assets/logo.png" alt="Phone Home logo" className="h-12 w-auto" />
                </Link>
                <p className="text-sm font-medium text-accent">Secure Checkout</p>
            </div>
        </header>
    );
}
