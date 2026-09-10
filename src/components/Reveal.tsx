'use client';

import { useEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import { cn } from '@/lib/utils';

// Fades a section in as it enters the viewport and back out as it leaves —
// the "progressive" Apple-style scroll feel the user asked for (content
// appears/disappears with scroll instead of the page reading as one long
// static list). No `once` lock: it re-triggers both ways on purpose.
//
// `motion-reduce:` forces full opacity/no offset unconditionally — a pure CSS
// override (not a JS branch) so it works even before hydration and never
// fights React's effect-timing rules.
export function Reveal({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section';
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Shrunk top/bottom margins mean a section is only "fully in" near the
    // middle of the viewport, so the previous one has already faded by the
    // time the next one settles — that's what avoids the infinite-scroll feel.
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.2, rootMargin: '-12% 0px -12% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      // TS can't reconcile one ref against a *union* of intrinsic elements'
      // per-tag ref types ('div' | 'section'); both are plain HTMLElements
      // and we only ever call IntersectionObserver methods on it.
      ref={ref as Ref<HTMLDivElement>}
      className={cn(
        // Same premium easing curve as FeatureScroller's crossfade — one
        // motion language across the whole site, not two different fades.
        'transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
