import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] relative">
      <Navbar />
      <div className="min-h-fit flex items-center justify-center px-4 py-8 mt-8">
        {children}
      </div>
      <Footer />
    </div>
  );
}
