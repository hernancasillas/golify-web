'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { DisplayHeading, Eyebrow, PhoneFrame } from '@/components/revamp/ui';
import { cn } from '@/lib/utils';

export type FeatureStory = {
  key: string;
  tone: 'mint' | 'gold';
  eyebrow: string;
  title: string;
  body: string;
  // Same inverted-contrast convention as the Home hero: dark-UI capture shows
  // on the light site, light-UI capture on the dark site. null = neither
  // screenshot dropped in yet, show the placeholder.
  imageSrcDark: string | null;
  imageSrcLight: string | null;
  placeholderLabel: string;
};

// Pinned scrollytelling canvas (the Apple product-page pattern): one phone +
// one text block stay fixed on screen while the user scrolls; the scroll
// position only picks which story is showing, crossfaded in the same spot —
// never a new block of page appearing below the last one.
export function FeatureScroller({ stories }: { stories: FeatureStory[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let ticking = false;
    function measure() {
      const el = track;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = el.offsetHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
      const idx = Math.min(stories.length - 1, Math.floor(progress * stories.length));
      setActive(idx);
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        measure();
        ticking = false;
      });
    }

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [stories.length]);

  return (
    <div
      ref={trackRef}
      className="relative"
      // 1 screen to pin + ~45vh of scroll per step to switch — the full
      // 100vh/step felt like too much scroll per swap.
      style={{ height: `${100 + stories.length * 45}vh` }}
    >
      <div className="sticky top-0 flex h-screen items-center">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-4 px-5 sm:gap-8 sm:px-8 lg:grid-cols-2 lg:gap-10">
          {/* Text — crossfade stack, all sharing the same box. Every story
              sits in the same grid cell (grid-area 1/1) instead of an
              absolute box with a guessed pixel height — the cell auto-sizes
              to the tallest one, so a longer string (or another locale)
              never overflows into the dots below it. */}
          <div className="order-2 flex flex-col items-center text-center lg:order-1 lg:items-start lg:text-left">
            <div className="grid w-full max-w-md">
              {stories.map((s, i) => (
                <div
                  key={s.key}
                  aria-hidden={i !== active}
                  className={cn(
                    '[grid-area:1/1] flex flex-col items-center transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] lg:items-start',
                    i === active
                      ? 'translate-y-0 scale-100 opacity-100'
                      : 'pointer-events-none translate-y-8 scale-[0.92] opacity-0',
                  )}
                >
                  <Eyebrow tone={s.tone}>{s.eyebrow}</Eyebrow>
                  <DisplayHeading as="h2" className="mt-4 text-3xl sm:text-4xl lg:text-6xl">
                    {s.title}
                  </DisplayHeading>
                  <p className="mt-4 text-base leading-relaxed font-semibold text-muted-foreground sm:text-lg">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>

            {/* Progress dots */}
            <div className="mt-4 flex gap-2">
              {stories.map((s, i) => (
                <span
                  key={s.key}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-500',
                    i === active ? 'w-8 bg-primary' : 'w-1.5 bg-border',
                  )}
                />
              ))}
            </div>
          </div>

          {/* Phone — one frame, crossfading screens inside it */}
          <div className="order-1 flex justify-center lg:order-2">
            <PhoneFrame className="h-[250px] w-[125px] sm:h-[380px] sm:w-[190px] lg:h-[520px] lg:w-[260px]">
              {stories.map((s, i) => (
                <div
                  key={s.key}
                  aria-hidden={i !== active}
                  className={cn(
                    'absolute inset-0 scale-110 opacity-0 blur-lg transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
                    i === active && 'scale-100 opacity-100 blur-none',
                  )}
                >
                  {s.imageSrcDark ? (
                    <Image
                      src={s.imageSrcDark}
                      alt={s.title}
                      fill
                      sizes="270px"
                      className="object-cover dark:hidden"
                    />
                  ) : null}
                  {s.imageSrcLight ? (
                    <Image
                      src={s.imageSrcLight}
                      alt={s.title}
                      fill
                      sizes="270px"
                      className="hidden object-cover dark:block"
                    />
                  ) : null}
                  {!s.imageSrcDark && !s.imageSrcLight ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#0F1D17] px-6 text-center">
                      <span className="text-2xl">📱</span>
                      <span className="text-xs font-bold text-white/40">{s.placeholderLabel}</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </PhoneFrame>
          </div>
        </div>
      </div>
    </div>
  );
}
