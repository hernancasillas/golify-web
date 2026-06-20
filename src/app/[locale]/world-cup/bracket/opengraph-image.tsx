import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const alt = 'Bracket Mundial 2026 — Golify';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Bespoke share card for the World Cup bracket page. Co-located with the route
// so Next wires it as og:image (X falls back to og:image when twitter:image is
// absent). No emoji — Satori needs an emoji set to render them, so we draw a
// small bracket motif with divs instead.
export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const en = locale === 'en';

  const iconBuffer = fs.readFileSync(
    path.join(process.cwd(), 'public/icon.png'),
  );
  const iconSrc = `data:image/png;base64,${iconBuffer.toString('base64')}`;

  const kicker = en ? 'WORLD CUP 2026 · LIVE' : 'MUNDIAL 2026 · EN VIVO';
  const title = en ? 'Knockout Bracket' : 'Bracket · La Llave';
  const subtitle = en
    ? 'Live knockout projection — updated every result'
    : 'Proyección en vivo — se actualiza con cada resultado';
  const badge = en ? 'Round of 32 → Final' : 'Dieciseisavos → Final';

  // tiny bracket motif (decorative)
  const line = (h: number) => (
    <div
      style={{
        width: 60,
        height: h,
        borderTop: '4px solid #71F59B',
        borderRight: '4px solid #71F59B',
        borderBottom: '4px solid #71F59B',
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
      }}
    />
  );

  return new ImageResponse(
    (
      <div
        style={{
          background: '#06180E',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '70px 90px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#71F59B',
              letterSpacing: '2px',
            }}
          >
            {kicker}
          </div>
          <img
            src={iconSrc}
            width={96}
            height={96}
            style={{ borderRadius: '22px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '56px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div
              style={{
                fontSize: 92,
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1,
                letterSpacing: '-3px',
              }}
            >
              {title}
            </div>
            <div
              style={{
                marginTop: 28,
                fontSize: 34,
                fontWeight: 400,
                color: '#ffffff',
                opacity: 0.82,
                lineHeight: 1.35,
                maxWidth: 720,
              }}
            >
              {subtitle}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 28,
              justifyContent: 'center',
            }}
          >
            {line(40)}
            {line(40)}
            {line(40)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              background: '#71F59B',
              color: '#06180E',
              fontSize: 26,
              fontWeight: 800,
              padding: '14px 32px',
              borderRadius: 999,
            }}
          >
            golify.futbol
          </div>
          <div style={{ fontSize: 26, color: '#ffffff', opacity: 0.75 }}>
            {badge}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
