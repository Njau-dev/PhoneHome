import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SearchBar from "@/components/layout/SearchBar";
import BackToTop from "@/components/layout/BackToTop";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] relative">
      <Navbar />
      <SearchBar />
      <main>{children}</main>
      <Footer />
      <BackToTop />
    </div>
  );
}
