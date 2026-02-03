"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Product } from "@/lib/types/product";
import {
  ChevronRight,
  Home,
  ShoppingCart,
  Phone,
  User,
  Heart,
  ShoppingBag,
  Info,
  Package,
  SquareStack,
} from "lucide-react";

interface BreadcrumbItem {
  name: string;
  path: string;
  isLast?: boolean;
}

interface BreadcrumbsProps {
  productData?: Product;
}

const Breadcrumbs = ({ productData }: BreadcrumbsProps) => {
  const pathname = usePathname();

  // Get the current path without the leading slash
  const path = pathname.substring(1);
  const pathSegments = path.split('/');

  // Function to capitalize first letter of each word
  const capitalize = (text: string) => {
    if (!text) return '';
    return text.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Function to get the appropriate icon based on the current page
  const getPageIcon = (pathSegments: string[]) => {
    const firstSegment = pathSegments[0];
    switch (firstSegment) {
      case '':
        return Home;
      case 'collection':
        return ShoppingBag;
      case 'cart':
        return ShoppingBag;
      case 'place-order':
        return ShoppingCart;
      case 'profile':
        return User;
      case 'orders':
        return Package;
      case 'wishlist':
        return Heart;
      case 'compare':
        return SquareStack;
      case 'contact':
        return Phone;
      case 'product':
        return null;
      default:
        return Info;
    }
  };

  // Build breadcrumb items based on the current path
  const generateBreadcrumbs = () => {
    const breadcrumbs: BreadcrumbItem[] = [
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

      // Add category for product pages
      const category = productData.type;
      if (category) {
        breadcrumbs.push({
          name: capitalize(category),
          path: `/collection/${category}`,
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
    <nav className="flex p-2.5 sm:p-4 text-xs md:text-sm border-t border-border bg-black/15" aria-label="Breadcrumb">
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
                  href={crumb.path}
                  className="text-primary hover:text-accent"
                >
                  {crumb.name}
                </Link>
              )}
            </li>
          ))}
        </ol>

        {/* Page Icon Container */}
        {PageIcon && (
          <div className="ml-4">
            <PageIcon
              className="text-accent h-6 w-6 hover:scale-110 hover:rotate-6 transition-transform duration-300 ease-in-out"
            />
          </div>
        )}
      </div>
    </nav>
  );
};

export default Breadcrumbs;
