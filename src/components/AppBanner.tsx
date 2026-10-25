'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/components/I18nProvider';
import { StoreLink } from '@/components/StoreLink';
import { APP_BANNER_KEY } from '@/lib/site';

/**
 * Smart-banner style strip above the nav, phones and tablets only (the desktop
 * nav has its own download button). Server-rendered so it takes its space
 * before first paint: no layout shift, and visitors coming from Instagram or
 * TikTok see the app CTA without scrolling. Safari's own Smart App Banner is
 * not reliable (no-op in in-app browsers, easy to dismiss forever), so this
 * does not depend on it.
 *
 * StoreLink sends each platform to its store and handles in-app browsers
 * (Android escapes via intent://, iOS opens the "open in browser" sheet).
 */
export function AppBanner() {
  const { t } = useI18n();
  const pathname = usePathname();
  const section = pathname.split('/')[2];
  // Seshio pages belong to another app; /app/* are open-in-app funnels.
  if (section === 'seshio' || section === 'app') return null;

  const dismiss = () => {
    document.documentElement.classList.add('app-banner-off');
    try {
      localStorage.setItem(APP_BANNER_KEY, String(Date.now()));
    } catch {
      /* private mode: the strip comes back on the next page */
    }
  };

  return (
    <div className="app-banner band-field border-b border-field-foreground/25 lg:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-3 py-2 pr-4 pl-2 sm:pr-8 sm:pl-6">
        <button
          type="button"
          onClick={dismiss}
          aria-label={t('appBanner.close')}
          className="flex h-8 w-8 shrink-0 items-center justify-center text-base leading-none font-black opacity-70"
        >
          ✕
        </button>
        <Image src="/icon.png" alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-[10px]" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-sm font-extrabold">{t('appBanner.title')}</p>
          <p className="truncate text-xs font-semibold text-field-muted">{t('appBanner.tagline')}</p>
        </div>
        <StoreLink store="auto" variant="dark" className="min-h-9 shrink-0 px-4 py-2 text-sm">
          {t('appBanner.cta')}
        </StoreLink>
      </div>
    </div>
  );
}
