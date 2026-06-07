import Image from 'next/image';

export function OpeningScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0fdf4] to-white dark:from-[#06180E] dark:to-[#041008] flex items-center justify-center">
      <div className="text-center">
        <Image
          src="/icon.png"
          alt="Golify"
          width={96}
          height={96}
          className="mx-auto mb-6 rounded-2xl"
        />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Opening Golify...
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          If the app doesn&apos;t open,{' '}
          <a
            href="https://apps.apple.com/app/id6772339872"
            className="text-[#0d5e26] dark:text-[#71F59B] underline"
          >
            download it here
          </a>
          .
        </p>
      </div>
    </div>
  );
}
