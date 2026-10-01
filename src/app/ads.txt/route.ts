import { ADSENSE_CLIENT } from '@/components/analytics/AnalyticsScripts';

// AdSense wants "pub-XXXX" here, while the client id is "ca-pub-XXXX".
export function GET() {
  const pub = ADSENSE_CLIENT.replace(/^ca-/, '');
  return new Response(`google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
