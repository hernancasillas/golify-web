import { DisplayHeading, PillLink } from '@/components/revamp/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <DisplayHeading as="h1" className="mb-4 text-6xl">
        404
      </DisplayHeading>
      <p className="mb-8 text-xl font-semibold text-muted-foreground">
        Page not found
      </p>
      <PillLink href="/es" variant="mint">
        Go home
      </PillLink>
    </div>
  );
}
