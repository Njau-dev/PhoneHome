import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/layout/BackToTop";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] relative">
      <Navbar />
      <main>{children}</main>
      <Footer />
      <BackToTop />
    </div>
  );
}
