import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import {
    ChevronRight,
    Home,
    ShoppingCart,
    List,
    Phone,
    User,
    Heart,
    ShoppingBag,
    Info,
} from 'lucide-react';
import { ShoppingBagIcon, Square3Stack3DIcon } from '@heroicons/react/24/outline';

const Breadcrumbs = ({ productData }) => {
    const location = useLocation();
    const { getProductCategory, getBrandName } = useContext(ShopContext);

    // Get the current path without the leading slash
    const path = location.pathname.substring(1);
    const pathSegments = path.split('/');

    // Function to capitalize first letter of each word
    const capitalize = (text) => {
        if (!text) return '';
        return text.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    // Function to get the appropriate icon based on the current page
    const getPageIcon = (pathSegments) => {
        const firstSegment = pathSegments[0];
        switch (firstSegment) {
            case '':
                return Home;
            case 'collection':
                return ShoppingBag;
            case 'cart':
                return ShoppingBagIcon;
            case 'place-order':
                return ShoppingCart;
            case 'profile':
                return User;
            case 'orders':
                return List;
            case 'wishlist':
                return Heart;
            case 'compare':
                return Square3Stack3DIcon;
            case 'contact':
                return Phone;
            default:
                return Info;
        }
    };

    // Build breadcrumb items based on the current path
    const generateBreadcrumbs = () => {
        const breadcrumbs = [
            { name: 'Home', path: '/' }
        ];

        if (pathSegments[0] === 'collection') {
            breadcrumbs.push({ name: 'Shop', path: '/collection' });

            // Add category if it exists
            if (pathSegments[1]) {
                breadcrumbs.push({
                    name: capitalize(pathSegments[1]),
                    path: `/collection/${pathSegments[1]}`
                });
            }
        }
        else if (pathSegments[0] === 'product' && productData) {
            breadcrumbs.push({ name: 'Shop', path: '/collection' });

            // Add category and brand for product pages
            const category = getProductCategory(productData);
            if (category) {
                breadcrumbs.push({
                    name: capitalize(category),
                    path: `/collection/${category}`,
                });
            }

            const brand = getBrandName(productData);
            if (brand) {
                breadcrumbs.push({
                    name: brand,
                    path: `/collection/${category}?brand=${brand}`,
                    isLast: false
                });
            }

            // Add product name
            breadcrumbs.push({
                name: productData.name || 'Product',
                path: `/product/${pathSegments[1]}`,
                isLast: true
            });
        }
        else if (pathSegments[0] === 'cart') {
            breadcrumbs.push({ name: 'Shop', path: '/collection' });
            breadcrumbs.push({ name: 'Cart', path: '/cart', isLast: true });
        }
        else if (pathSegments[0] === 'place-order') {
            breadcrumbs.push({ name: 'Shop', path: '/collection' });
            breadcrumbs.push({ name: 'Cart', path: '/cart' });
            breadcrumbs.push({ name: 'Place Order', path: '/place-order', isLast: true });
        }
        else if (pathSegments[0] === 'profile') {
            breadcrumbs.push({ name: 'Profile', path: '/profile', isLast: true });
        }
        else if (pathSegments[0] === 'orders') {
            breadcrumbs.push({ name: 'Profile', path: '/profile' });
            breadcrumbs.push({ name: 'Orders', path: '/orders', isLast: true });
        }
        else if (pathSegments[0] === 'wishlist') {
            breadcrumbs.push({ name: 'Profile', path: '/profile' });
            breadcrumbs.push({ name: 'Wishlist', path: '/wishlist', isLast: true });
        }
        else if (pathSegments[0] === 'compare') {
            breadcrumbs.push({ name: 'Shop', path: '/collection' });
            breadcrumbs.push({ name: 'Compare', path: '/compare', isLast: true });
        }
        else if (pathSegments[0] === 'contact') {
            breadcrumbs.push({ name: 'Contact', path: '/contact', isLast: true });
        }

        return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumbs();

    // Don't render if we only have the Home link
    if (breadcrumbs.length <= 1) return null;

    // Get the icon for the current page
    const PageIcon = getPageIcon(pathSegments);

    return (
        <nav className="flex p-4 text-xs md:text-sm border-t border-border bg-black/15" aria-label="Breadcrumb">
            <div className="flex items-center justify-between w-full">
                <ol className="inline-flex items-center space-x-1 md:space-x-2">
                    {breadcrumbs.map((crumb, index) => (
                        <li key={index} className="inline-flex items-center">
                            {index > 0 && (
                                <span className="sm:mx-2 text-accent"><ChevronRight className='h-4' /></span>
                            )}
                            {crumb.isLast ? (
                                <span className="text-accent">{crumb.name}</span>
                            ) : (
                                <Link
                                    to={crumb.path}
                                    className="text-primary hover:text-accent"
                                >
                                    {crumb.name}
                                </Link>
                            )}
                        </li>
                    ))}
                </ol>

                {/* Page Icon Container */}
                <div className="ml-4">
                    <PageIcon
                        className="text-accent h-6 w-6 
                        hover:scale-110 
                        hover:rotate-6 
                        transition-transform 
                        duration-300 
                        ease-in-out"
                    />
                </div>
            </div>
        </nav>
    );
};

export default Breadcrumbs;