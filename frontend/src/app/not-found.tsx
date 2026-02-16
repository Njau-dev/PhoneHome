import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-accent mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-gray-400 mb-8">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="bg-accent text-bg px-6 py-3 rounded-lg hover:bg-accent/90 transition-colors"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
}
