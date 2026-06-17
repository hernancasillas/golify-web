'use client';

import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/site';

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
    <div className="my-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {deeplink ? (
        <a
          href={deeplink}
          className="rounded-lg bg-green-600 px-5 py-3 text-center font-semibold text-white hover:bg-green-700"
        >
          {labels.open}
        </a>
      ) : null}
      <a
        href={APP_STORE_URL}
        className="rounded-lg bg-black px-5 py-3 text-center font-semibold text-white hover:bg-neutral-800"
      >
        {labels.ios}
      </a>
      <a
        href={PLAY_STORE_URL}
        className="rounded-lg bg-black px-5 py-3 text-center font-semibold text-white hover:bg-neutral-800"
      >
        {labels.android}
      </a>
    </div>
  );
}
