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
  Info,
  Package,
  SquareStack,
  Store,
  ShoppingBag,
} from "lucide-react";

interface BreadcrumbItem {
  name: string;
  path: string;
  isLast?: boolean;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
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

  const buildCollectionPath = (filters: { category?: string; brand?: string }) => {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.brand) params.set("brand", filters.brand);
    const query = params.toString();
    return query ? `/collection?${query}` : "/collection";
  };

  // Build breadcrumb items based on the current path
  const generateBreadcrumbs = () => {
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', path: '/', icon: Home }
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
      const brand = productData.brand;
      if (category) {
        breadcrumbs.push({
          name: capitalize(category),
          path: buildCollectionPath({ category }),
        });
      }

      // Add brand and keep both category + brand selected in collection
      if (brand) {
        breadcrumbs.push({
          name: brand,
          path: buildCollectionPath({ category, brand }),
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
      const orderId = pathSegments[1] ? decodeURIComponent(pathSegments[1]) : null;
      breadcrumbs.push({ name: 'Profile', path: '/profile' });
      breadcrumbs.push({ name: 'Orders', path: '/orders', isLast: !orderId });
      if (orderId) {
        breadcrumbs.push({
          name: orderId,
          path: pathname,
          isLast: true,
        });
      }
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

  const firstSegment = pathSegments[0];
  const showPageIcon = firstSegment !== "product";
  const iconClassName =
    "text-accent h-5 w-5 sm:h-6 sm:w-6 hover:scale-110 hover:rotate-6 transition-transform duration-300 ease-in-out";

  return (
    <nav className="flex py-2.5 px-4 sm:py-4 sm:px-6 text-xs md:text-sm bg-black/15 rounded-b-3xl" aria-label="Breadcrumb">
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
                  {crumb.icon ? <crumb.icon className="h-4" /> : crumb.name}
                </Link>
              )}
            </li>
          ))}
        </ol>

        {/* Page Icon Container */}
        {showPageIcon && (
          <div className="ml-4">
            {firstSegment === "" && <Home className={iconClassName} />}
            {firstSegment === "collection" && <Store className={iconClassName} />}
            {firstSegment === "cart" && <ShoppingCart className={iconClassName} />}
            {firstSegment === "place-order" && <ShoppingBag className={iconClassName} />}
            {firstSegment === "profile" && <User className={iconClassName} />}
            {firstSegment === "orders" && <Package className={iconClassName} />}
            {firstSegment === "wishlist" && <Heart className={iconClassName} />}
            {firstSegment === "compare" && <SquareStack className={iconClassName} />}
            {firstSegment === "contact" && <Phone className={iconClassName} />}
            {![
              "",
              "collection",
              "cart",
              "place-order",
              "profile",
              "orders",
              "wishlist",
              "compare",
              "contact",
            ].includes(firstSegment) && <Info className={iconClassName} />}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Breadcrumbs;
