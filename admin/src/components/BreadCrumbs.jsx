import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumbs component for admin dashboard
 * 
 * @param {Object} props
 * @param {Object} props.customCrumbs - Optional custom breadcrumbs to override automatic ones
 * @param {string} props.customCrumbs.title - Custom title to display
 * @param {string} props.customCrumbs.path - Custom path to link to
 * @param {boolean} props.showHome - Whether to show the home link (default: true)
 * @returns {JSX.Element}
 */
const Breadcrumbs = ({ customCrumbs, showHome = true }) => {
    const location = useLocation();

    // Get the current path and split it into segments
    const pathSegments = location.pathname.split('/').filter(segment => segment !== '');

    // Routes mapping for friendly names
    const routeNames = {
        'dashboard': 'Dashboard',
        'products': 'Products',
        'products/add': 'Add Product',
        'products/edit': 'Edit Product',
        'orders': 'Orders',
        'users': 'Users',
        'settings': 'Settings',
        // Add more routes as needed
    };

    // Helper to get the full path for each segment level
    const getPathForSegment = (index) => {
        return '/' + pathSegments.slice(0, index + 1).join('/');
    };

    // Generate breadcrumbs based on the current path
    const generateBreadcrumbs = () => {
        // If custom breadcrumbs are provided, use those
        if (customCrumbs) {
            return customCrumbs.map((crumb, index) => ({
                title: crumb.title,
                path: crumb.path,
                isLast: index === customCrumbs.length - 1
            }));
        }

        // Otherwise generate from the current path
        return pathSegments.map((segment, index) => {
            // Handle special cases for nested routes
            const path = getPathForSegment(index);
            let title;

            // Check for composite paths like "products/add"
            if (index > 0 && routeNames[`${pathSegments[index - 1]}/${segment}`]) {
                title = routeNames[`${pathSegments[index - 1]}/${segment}`];
            } else {
                // Check if we have a friendly name for this segment
                title = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
            }

            return {
                title,
                path,
                isLast: index === pathSegments.length - 1
            };
        });
    };

    const breadcrumbs = generateBreadcrumbs();

    // Return early if we're on the dashboard and showHome is false
    if (pathSegments.length === 1 && pathSegments[0] === 'dashboard' && !showHome) {
        return null;
    }

    return (
        <nav className="flex py-3 text-sm sticky top-0 z-10 bg-bgdark">
            <ol className="flex items-center space-x-1">
                {/* Home link */}
                {showHome && (
                    <>
                        <li className="flex items-center">
                            <Link
                                to="/dashboard"
                                className="text-secondary hover:text-primary flex items-center transition-colors"
                            >
                                <Home className="h-4 w-4" />
                                <span className="sr-only">Home</span>
                            </Link>
                        </li>
                        {breadcrumbs.length > 0 && (
                            <li>
                                <ChevronRight className="h-4 w-4 text-secondary mx-1" />
                            </li>
                        )}
                    </>
                )}

                {/* Breadcrumb links */}
                {breadcrumbs.map((crumb, index) => (
                    <li key={index} className="flex items-center">
                        {index > 0 && (
                            <ChevronRight className="h-4 w-4 text-secondary mx-1" />
                        )}
                        {crumb.isLast ? (
                            <span className="text-accent font-medium">{crumb.title}</span>
                        ) : (
                            <Link
                                to={crumb.path}
                                className="text-secondary hover:text-primary transition-colors"
                            >
                                {crumb.title}
                            </Link>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;