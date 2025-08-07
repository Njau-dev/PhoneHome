import Hero from '../components/Hero'
import LatestCollection from '../components/LatestCollection'
import BestSeller from '../components/BestSeller'
import OurPolicy from '../components/OurPolicy'
import NewsLetterBox from '../components/NewsLetterBox'
import ShopByCategory from '../components/ShopByCategory'
import ShoppingProcessSection from '../components/ShoppingProcessSection'
import ShopByBrandsContainer from '../components/ShopByBrandsContainer'

const Home = () => {
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
  )
}

export default Home
