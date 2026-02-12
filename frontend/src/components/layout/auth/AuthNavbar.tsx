import Link from "next/link";

export default function AuthNavbar() {
    return (
        <header className="sticky top-0 z-40 border-b border-nav-border py-4 text-nav-text">
            <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <img src="/assets/logo.png" alt="Phone Home logo" className="h-12 w-auto" />
                </Link>
                <span className="text-sm text-nav-muted">Account Access</span>
            </div>
        </header>
    );
}
