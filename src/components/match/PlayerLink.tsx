import Link from 'next/link';
import { playerPath, type RouteLocale } from '@/lib/routes';

/** A player's name, linked to the canonical player page when we have an id. */
export function PlayerLink({
  id,
  name,
  locale,
  className,
}: {
  id: number | null | undefined;
  name: string;
  locale: RouteLocale;
  className?: string;
}) {
  if (!name) return null;
  if (!id || id <= 0) return <span className={className}>{name}</span>;
  return (
    <Link href={playerPath(locale, { id, name })} className={className ?? 'hover:underline'}>
      {name}
    </Link>
  );
}
