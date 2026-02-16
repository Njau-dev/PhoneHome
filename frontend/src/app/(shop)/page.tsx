import Hero from "@/components/home/Hero";
import LatestCollection from "@/components/home/LatestCollection";
import OurPolicy from "@/components/home/OurPolicy";
import NewsLetterBox from "@/components/common/NewsLetterBox";
import ShoppingProcessSection from "@/components/home/ShoppingProcessSection";
import ShopByBrandsContainer from "@/components/home/ShopByBrandsContainer";
import BestDeals from "@/components/home/BestDeals";
import PromotionalBanners from "@/components/home/PromotionalBanners";

export default function Home() {
  return (
    <div>
      <Hero />
      <BestDeals />
      <LatestCollection />
      <PromotionalBanners />
      <ShopByBrandsContainer />
      <ShoppingProcessSection />
      <OurPolicy />
      <NewsLetterBox />
    </div>
  );
}
