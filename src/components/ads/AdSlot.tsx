import { AdUnit } from './AdUnit';

// The one ad component (plan §0.5). Pages place it wherever the template
// rules allow; whether anything renders is decided here, by flag:
//
//   NEXT_PUBLIC_ADS_ENABLED=1        master switch (Part C turns it on after
//                                    AdSense approval). Off → renders nothing.
//   NEXT_PUBLIC_ADSENSE_SLOTS        JSON map {placementId: "data-ad-slot"}.
//                                    A placement with no unit renders nothing.
//
// Rules enforced here rather than trusted to each page (plan C3):
//   - `indexable={false}` (thin / noindex pages) never shows ads.
//   - When it renders, the box reserves its height up front (CLS < 0.1) and
//     the unit only requests an ad once it nears the viewport (lazy).

export type AdFormat = 'leaderboard' | 'rectangle' | 'in-article';

const MIN_HEIGHT: Record<AdFormat, string> = {
  leaderboard: 'min-h-[100px] md:min-h-[90px]',
  rectangle: 'min-h-[250px]',
  'in-article': 'min-h-[280px] md:min-h-[250px]',
};

function slotMap(): Record<string, string> {
  try {
    return JSON.parse(process.env.NEXT_PUBLIC_ADSENSE_SLOTS ?? '{}');
  } catch {
    return {};
  }
}

export const ADS_ON = process.env.NEXT_PUBLIC_ADS_ENABLED === '1';

export function AdSlot({
  id,
  format = 'leaderboard',
  indexable = true,
  label = 'Publicidad',
  className,
}: {
  /** Stable placement id, e.g. "match-below-score". Maps to an AdSense unit. */
  id: string;
  format?: AdFormat;
  /** Pass the page's indexability: no ads on noindex/thin pages. */
  indexable?: boolean;
  label?: string;
  className?: string;
}) {
  if (!ADS_ON || !indexable) return null;
  const unit = slotMap()[id];
  if (!unit) return null;
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? 'ca-pub-2057486044857110';

  return (
    <aside aria-label={label} data-ad-placement={id} className={`my-6 flex flex-col items-center ${className ?? ''}`}>
      <span className="mb-1 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">{label}</span>
      <div className={`w-full overflow-hidden ${MIN_HEIGHT[format]}`}>
        <AdUnit client={client} slot={unit} format={format} />
      </div>
    </aside>
  );
}
