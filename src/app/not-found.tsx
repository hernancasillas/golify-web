import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-green-600 dark:text-green-400 mb-4">404</h1>
      <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
        Page not found
      </p>
      <Link
        href="/es"
        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold"
      >
        Go home
      </Link>
    </div>
  );
}
