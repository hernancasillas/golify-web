'use client';

import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { track, type EventName, type EventParams } from '@/lib/analytics';

// Links and buttons that report a plan §0.6 event on click. Render as normal
// anchors, so crawlers and no-JS visitors get a plain link.

export function TrackedLink({
  event,
  params,
  href,
  children,
  external,
  ...rest
}: {
  event: EventName;
  params?: EventParams;
  href: string;
  children: ReactNode;
  /** Plain <a> (downloads, stores, other origins) instead of next/link. */
  external?: boolean;
} & Omit<ComponentProps<'a'>, 'href' | 'children'>) {
  const onClick: ComponentProps<'a'>['onClick'] = (e) => {
    track(event, params);
    rest.onClick?.(e);
  };
  if (external) {
    return (
      <a href={href} {...rest} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} {...rest} onClick={onClick}>
      {children}
    </Link>
  );
}

export function TrackedButton({
  event,
  params,
  children,
  ...rest
}: { event: EventName; params?: EventParams; children: ReactNode } & ComponentProps<'button'>) {
  return (
    <button
      type="button"
      {...rest}
      onClick={(e) => {
        track(event, params);
        rest.onClick?.(e);
      }}
    >
      {children}
    </button>
  );
}
