import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-[#0d5e26] dark:text-[#71F59B] mb-4">404</h1>
      <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
        Page not found
      </p>
      <Link
        href="/es"
        className="px-6 py-3 bg-[#71F59B] hover:bg-[#4edd7a] text-[#06180E] rounded-md font-semibold"
      >
        Go home
      </Link>
    </div>
  );
}
