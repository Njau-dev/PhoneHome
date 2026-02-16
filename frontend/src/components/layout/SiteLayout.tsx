import Breadcrumbs from "../common/BreadCrumbs";
import AuthFooter from "./auth/AuthFooter";
import AuthNavbar from "./auth/AuthNavbar";
import BackToTop from "./BackToTop";
import CheckoutFooter from "./checkout/CheckoutFooter";
import CheckoutNavbar from "./checkout/CheckoutNavbar";
import Container from "./Container";
import ShopFooter from "./shop/ShopFooter";
import ShopNavbar from "./shop/ShopNavbar";

type Variant = "shop" | "checkout" | "auth";

export default function SiteLayout({
    children,
    variant,
}: {
    children: React.ReactNode;
    variant: Variant;
}) {
    const isAuth = variant === "auth";

    const Navbar = {
        shop: <ShopNavbar />,
        checkout: <CheckoutNavbar />,
        auth: <AuthNavbar />,
    }[variant];

    const Footer = {
        shop: <ShopFooter />,
        checkout: <CheckoutFooter />,
        auth: <AuthFooter />,
    }[variant];

    return (
        <div className="flex min-h-screen flex-col">
            {/* NAVBAR - Now Sticky */}
            <div className="sticky top-0 z-50 bg-black-soft shadow-md">
                <Container>
                    {Navbar}
                </Container>
            </div>

            {/* BREADCRUMBS */}
            {variant === "shop" && (
                <div className="-bg">
                    <Container>
                        <Breadcrumbs />
                    </Container>
                </div>
            )}

            {/* MAIN */}
            <main className={`flex-1 ${isAuth ? "flex" : ""}`}>
                <Container className={isAuth ? "flex flex-1 items-center justify-center py-8" : ""}>
                    {children}
                </Container>
            </main>

            {/* FOOTER */}
            <div className="bg-black-soft mt-16">
                <Container>{Footer}</Container>
            </div>

            <BackToTop />
        </div>
    );
}
