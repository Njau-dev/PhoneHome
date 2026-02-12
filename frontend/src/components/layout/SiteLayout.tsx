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
        <>
            {/* NAVBAR */}
            <div className="bg-black-soft">
                <Container>{Navbar}</Container>
            </div>
            {variant === "shop" && (
                <div className="border-b border-border-light bg-bg">
                    <Container>
                        <Breadcrumbs />
                    </Container>
                </div>
            )}

            {/* MAIN */}
            <main className=" min-h-screen">
                <Container>{children}</Container>
            </main>

            {/* FOOTER */}
            <div className="bg-black-soft mt-16">
                <Container>{Footer}</Container>
            </div>

            <BackToTop />
        </>
    );
}
