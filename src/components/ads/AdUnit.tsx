'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// Requests the ad only when the reserved box nears the viewport.
export function AdUnit({ client, slot, format }: { client: string; slot: string; format: string }) {
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let done = false;
    const load = () => {
      if (done) return;
      done = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {}
    };
    if (!('IntersectionObserver' in window)) {
      load();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          load();
          io.disconnect();
        }
      },
      { rootMargin: '300px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <ins
      ref={ref}
      className="adsbygoogle block"
      style={{ display: 'block' }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format === 'in-article' ? 'fluid' : 'auto'}
      data-ad-layout={format === 'in-article' ? 'in-article' : undefined}
      data-full-width-responsive="true"
    />
  );
}
