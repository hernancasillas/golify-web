import Image from 'next/image';

export function OpeningScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Image
          src="/icon.png"
          alt="Golify"
          width={96}
          height={96}
          className="mx-auto mb-6 rounded-2xl"
        />
        <h1 className="mb-4 text-2xl font-bold text-foreground">
          Opening Golify...
        </h1>
        <p className="font-semibold text-muted-foreground">
          If the app doesn&apos;t open,{' '}
          <a
            href="https://apps.apple.com/app/id6772339872"
            className="text-primary underline"
          >
            download it here
          </a>
          .
        </p>
      </div>
    </div>
  );
}
