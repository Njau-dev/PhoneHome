import { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";

const ShopByCategorySection = () => {
    const { navigate } = useContext(ShopContext);
    const categories = [
        {
            name: 'Phones',
            image: 'src/assets/images/phone-banner.jpg',
            link: '/collection/phone',
        },
        {
            name: 'Tablets',
            image: 'src/assets/images/ipad_pro_home.jpg',
            link: '/collection/tablet',
        },
        {
            name: 'Laptops',
            image: 'src/assets/images/laptop-category.png',
            link: '/collection/laptop',
        },
        {
            name: 'Audio',
            image: 'src/assets/images/Airpods-Max-e.png',
            link: '/collection/audio',
        },
    ];

    return (
        <div className="w-full bg-bgdark my-10">
            {/* category section with background image */}
            <div className="relative w-full h-96 lg:h-[480px] bg-contain bg-center rounded-lg" style={{ backgroundImage: "url('src/assets/images/CMF-1-Banner.webp')" }}>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-primary">
                    {/* Larger title wrapper */}
                    <div className="transform scale-125 md:scale-150">
                        <Title text1={'SHOP'} text2={'BY CATEGORY'} />
                    </div>
                    <button
                        onClick={() => navigate('/collection')}
                        className='bg-accent hover:bg-bgdark hover:text-accent hover:border border-accent rounded text-bgdark text-base mt-12 mb-3 py-3 px-11 transition-all duration-300'
                    >
                        SHOP COLLECTION
                    </button>
                </div>
            </div>

            {/* Categories section that overlaps the hero */}
            <div className="container mx-auto px-4 -mt-20 lg:-mt-32 pb-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((category) => (
                        <div
                            key={category.name}
                            className="relative overflow-hidden rounded-lg shadow-lg h-80 group cursor-pointer"
                            onClick={() => navigate(category.link)}
                        >
                            <img
                                src={category.image}
                                alt={`${category.name} category`}
                                className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                            />
                            <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black/70 to-transparent transition-all duration-300 group-hover:from-black/80">
                                <div className="text-primary transform transition-transform duration-300 group-hover:translate-y-[-8px]">
                                    <p className="text-sm mb-1 opacity-90 group-hover:opacity-100">Shop the collection</p>
                                    <h3 className="text-xl font-medium mb-4 group-hover:text-accent transition-colors duration-300">{category.name}</h3>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ShopByCategorySection;