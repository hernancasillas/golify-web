import { InstallCTA } from '@/components/InstallCTA';

// "Sigue a {team} en Golify": the conversion block every team page ends on.
// The deep link opens the team screen when the app is installed; the store
// buttons cover everyone else.
export function TeamCta({
  teamId,
  title,
  body,
  labels,
  compact = false,
}: {
  teamId: number;
  title: string;
  body: string;
  labels: { open: string; ios: string; android: string };
  compact?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-surface to-band p-5 sm:p-6">
      <h2 className={compact ? 'font-display text-xl font-bold tracking-wide uppercase' : 'font-display text-2xl font-bold tracking-wide uppercase'}>
        {title}
      </h2>
      <p className="mt-2 leading-relaxed font-semibold text-muted-foreground">{body}</p>
      <div className="mt-4">
        <InstallCTA deeplink={`golify://team/${teamId}`} labels={labels} />
      </div>
    </section>
  );
}
