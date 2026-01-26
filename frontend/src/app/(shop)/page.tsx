import Hero from "@/components/home/Hero";
import LatestCollection from "@/components/home/LatestCollection";
import BestSeller from "@/components/home/BestSeller";
import OurPolicy from "@/components/common/OurPolicy";
import NewsLetterBox from "@/components/common/NewsLetterBox";
import ShopByCategory from "@/components/home/ShopByCategory";
import ShoppingProcessSection from "@/components/home/ShoppingProcessSection";
import ShopByBrandsContainer from "@/components/home/ShopByBrandsContainer";

export default function Home() {
  return (
    <div>
      <Hero />
      <LatestCollection />
      <ShopByCategory />
      <BestSeller />
      <ShopByBrandsContainer />
      <ShoppingProcessSection />
      <OurPolicy />
      <NewsLetterBox />
    </div>
  );
}
