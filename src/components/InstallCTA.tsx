'use client';

import { StoreLink } from '@/components/StoreLink';
import { PillLink } from '@/components/revamp/ui';

// Install call-to-action. Replaces the old auto-redirect funnels: content stays
// crawlable/visible, the user (or crawler) sees real facts, and a human can tap
// to open the app or the right store. `deeplink` opens the in-app screen if
// installed; otherwise the store buttons cover both platforms.
export function InstallCTA({
  deeplink,
  labels,
}: {
  deeplink?: string;
  labels: { open: string; ios: string; android: string };
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {deeplink ? (
        <PillLink href={deeplink} variant="mint">
          {labels.open}
        </PillLink>
      ) : null}
      {/* StoreLink handles social in-app browsers: Android escapes via
          intent://, iOS opens the "open in browser" hint sheet. */}
      <StoreLink
        store="ios"
        variant="dark"
        className="rounded-lg px-5 py-3 font-semibold"
      >
        {labels.ios}
      </StoreLink>
      <StoreLink
        store="android"
        variant="dark"
        className="rounded-lg px-5 py-3 font-semibold"
      >
        {labels.android}
      </StoreLink>
    </div>
  );
}
