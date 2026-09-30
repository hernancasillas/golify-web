import Script from 'next/script';
import { QrScanReporter } from './QrScanReporter';

// Consent Mode v2 defaults + GA4 + (when enabled) the AdSense loader.
//
// Order matters: the consent defaults must run before any Google tag reads
// them, so they are an inline script in the document, ahead of gtag.js.
//   - EEA, UK and Switzerland: everything denied until the Google-certified
//     CMP (AdSense "Privacy & messaging", TCF v2.2) records a choice.
//   - Brazil (LGPD): denied until our own banner records a choice
//     (components/consent/ConsentBanner.tsx).
//   - Everywhere else: granted.
const EEA_UK_CH = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV',
  'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB', 'CH',
];
export const CONSENT_REGIONS = [...EEA_UK_CH, 'BR'];

export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID ?? '';
export const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === '1';
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? 'ca-pub-2057486044857110';

const consentDefaults = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',region:${JSON.stringify(
  CONSENT_REGIONS,
)},wait_for_update:500});
gtag('consent','default',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'});
try{var c=localStorage.getItem('golify-consent');if(c==='granted'||c==='denied'){var v=c;gtag('consent','update',{ad_storage:v,ad_user_data:v,ad_personalization:v,analytics_storage:v});}}catch(e){}
gtag('set','ads_data_redaction',true);`;

export function AnalyticsScripts() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: consentDefaults }} />
      {GA4_ID ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`gtag('js',new Date());gtag('config',${JSON.stringify(GA4_ID)});`}
          </Script>
        </>
      ) : null}
      {ADS_ENABLED ? (
        <Script
          id="adsense"
          async
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        />
      ) : null}
      <QrScanReporter />
    </>
  );
}
