import { Link } from 'react-router-dom';
import { MoveLeft } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="min-h-[70vh] flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-6xl sm:text-8xl font-bold text-accent mb-4">404</h1>
                <h2 className="text-2xl sm:text-3xl font-medium mb-4">Page Not Found</h2>
                <p className="text-secondary mb-8">The page you're looking for doesn't exist or has been moved.</p>
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 bg-accent text-bgdark px-6 py-3 rounded-full hover:bg-bgdark hover:text-accent hover:border border-accent transition-all"
                >
                    <MoveLeft size={20} />
                    Back to Home
                </Link>
            </div>
        </div>
    );
};

export default NotFound;