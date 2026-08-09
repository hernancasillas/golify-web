'use client';

import { useState, type ReactNode } from 'react';
import { PillLink } from '@/components/revamp/ui';
import { InAppBrowserSheet, useBrowserEnv } from '@/components/InAppBrowserHint';
import { androidIntentUrl, playStoreIntentUrl } from '@/lib/in-app-browser';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/site';

type Store = 'ios' | 'android' | 'auto';

/**
 * Store CTA that survives social in-app browsers (Instagram / TikTok / Facebook).
 *
 *   - Android in-app WebView → rewrites the href to `intent://…;scheme=market`,
 *     which the WebView hands to the Play Store app. No user action needed.
 *   - iOS in-app WebView → the App Store universal link is a dead end there, so
 *     the tap opens a sheet explaining ⋯ → "Open in browser" (+ copy link).
 *   - Real browsers / desktop / crawlers → plain store link, unchanged.
 */
export function StoreLink({
  store = 'auto',
  children,
  className,
  variant = 'mint',
}: {
  store?: Store;
  children: ReactNode;
  className?: string;
  variant?: 'mint' | 'gold' | 'outline' | 'dark';
}) {
  const env = useBrowserEnv();
  const [sheet, setSheet] = useState(false);

  // SSR / pre-hydration default: App Store for `auto` (safe for crawlers).
  const platformStore: Exclude<Store, 'auto'> =
    store !== 'auto' ? store : env?.platform === 'android' ? 'android' : 'ios';

  const webUrl = platformStore === 'android' ? PLAY_STORE_URL : APP_STORE_URL;
  const inAndroidWebView = env?.platform === 'android' && env.inApp !== null;
  const inIosWebView = env?.platform === 'ios' && env.inApp !== null;

  let href = webUrl;
  if (inAndroidWebView) {
    href =
      platformStore === 'android'
        ? playStoreIntentUrl()
        : androidIntentUrl(webUrl, 'com.android.chrome');
  }

  // iOS webviews can't hand off to the App Store app — intercept and explain.
  const blocked = inIosWebView && platformStore === 'ios';

  return (
    <>
      <PillLink
        href={href}
        variant={variant}
        className={className}
        onClick={
          blocked
            ? (e) => {
                e.preventDefault();
                setSheet(true);
              }
            : undefined
        }
      >
        {children}
      </PillLink>
      {env ? (
        <InAppBrowserSheet
          open={sheet}
          onClose={() => setSheet(false)}
          env={env}
          fallbackHref={webUrl}
        />
      ) : null}
    </>
  );
}
