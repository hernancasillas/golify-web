'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useI18n } from '@/components/I18nProvider';
import {
  IN_APP_LABELS,
  readBrowserEnv,
  type BrowserEnv,
  type InAppApp,
} from '@/lib/in-app-browser';

// The UA never changes during a session, so the store is a constant snapshot
// with a no-op subscription. Cached so the reference stays stable across renders.
let cachedEnv: BrowserEnv | null = null;
const subscribeNoop = () => () => {};
const getEnvSnapshot = () => (cachedEnv ??= readBrowserEnv());
const getServerEnvSnapshot = () => null;

/**
 * Live browser environment. `null` during SSR and the hydration pass, so the
 * markup always matches and crawlers never see the hint UI.
 */
export function useBrowserEnv(): BrowserEnv | null {
  return useSyncExternalStore(subscribeNoop, getEnvSnapshot, getServerEnvSnapshot);
}

/** Apps whose "⋯" lives at the bottom of the webview chrome instead of the top. */
const BOTTOM_MENU: InAppApp[] = ['facebook', 'messenger'];

function useCopyLink() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Older webviews: clipboard API is missing or permission-blocked.
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, []);
  return { copied, copy };
}

/**
 * Bottom sheet that explains how to leave the in-app browser.
 *
 * Shown when an iOS in-app webview swallows a store link — there is no way to
 * escape programmatically there, so the user has to tap ⋯ → "Open in browser".
 */
export function InAppBrowserSheet({
  open,
  onClose,
  env,
  fallbackHref,
}: {
  open: boolean;
  onClose: () => void;
  env: BrowserEnv;
  /** Store URL to hit anyway if the user insists (may render as a web page). */
  fallbackHref?: string;
}) {
  const { t } = useI18n();
  const { copied, copy } = useCopyLink();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const appName = env.inApp ? IN_APP_LABELS[env.inApp] : '';
  const bottomMenu = env.inApp ? BOTTOM_MENU.includes(env.inApp) : false;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-t-3xl border-t border-foreground/10 bg-background p-6 pb-8 shadow-[0_-20px_60px_rgba(0,0,0,0.45)] sm:mb-6 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pointer toward the ⋯ button in the host app's chrome. */}
        <div
          className={
            bottomMenu
              ? 'pointer-events-none absolute right-6 -bottom-8 text-3xl'
              : 'pointer-events-none absolute -top-10 right-6 text-3xl'
          }
          aria-hidden
        >
          {bottomMenu ? '↓' : '↑'}
        </div>

        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-foreground/20" />

        <h2 className="text-xl font-extrabold">{t('inApp.title')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {appName
            ? t('inApp.bodyNamed').replace('{app}', appName)
            : t('inApp.body')}
        </p>

        <ol className="mt-5 space-y-3">
          {[
            bottomMenu ? t('inApp.stepMenuBottom') : t('inApp.stepMenuTop'),
            t('inApp.stepOpen'),
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground">
                {i + 1}
              </span>
              <span className="text-sm font-semibold">{step}</span>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={copy}
          className="mt-6 w-full rounded-full bg-primary px-6 py-3.5 text-sm font-extrabold text-primary-foreground transition hover:brightness-105"
        >
          {copied ? t('inApp.copied') : t('inApp.copy')}
        </button>

        <div className="mt-3 flex items-center justify-between text-xs font-semibold">
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            {t('inApp.close')}
          </button>
          {fallbackHref ? (
            <a
              href={fallbackHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground underline-offset-4 hover:underline"
            >
              {t('inApp.continueAnyway')}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const DISMISS_KEY = 'golify.inAppHint.dismissed';

/**
 * Slim top banner shown on every page load inside an iOS in-app browser, before
 * the user even taps a store button. Dismissed for the rest of the session.
 */
export function InAppBrowserBanner() {
  const { t } = useI18n();
  const env = useBrowserEnv();
  // Read once, lazily. Safe for hydration: this component renders null until
  // `env` resolves (post-hydration), so the flag never affects server markup.
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [sheet, setSheet] = useState(false);

  // Android escapes on its own via intent:// — no banner needed there.
  if (!env || !env.inApp || env.platform !== 'ios' || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* private mode — banner just comes back next load */
    }
  };

  return (
    <>
      <div className="sticky top-0 z-50 flex items-center gap-3 bg-gold px-4 py-2.5 text-gold-foreground">
        <button
          type="button"
          onClick={() => setSheet(true)}
          className="flex-1 text-left text-xs leading-snug font-extrabold"
        >
          {t('inApp.bannerText')}{' '}
          <span className="underline underline-offset-2">{t('inApp.bannerCta')}</span>
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t('inApp.close')}
          className="shrink-0 px-1 text-base leading-none font-black opacity-70"
        >
          ✕
        </button>
      </div>
      <InAppBrowserSheet open={sheet} onClose={() => setSheet(false)} env={env} />
    </>
  );
}
