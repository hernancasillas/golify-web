import { ImageResponse } from 'next/og'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const alt = 'Golify - Football Tracker'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const iconBuffer = fs.readFileSync(path.join(process.cwd(), 'public/icon.png'))
  const iconSrc = `data:image/png;base64,${iconBuffer.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          background: '#06180E',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '80px 100px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: '#71F59B',
              lineHeight: 1,
              letterSpacing: '-2px',
            }}
          >
            Golify
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 400,
              color: '#ffffff',
              opacity: 0.85,
              lineHeight: 1.4,
              maxWidth: '560px',
            }}
          >
            Football Tracker · Retas · EA FC Catalog
          </div>
          <div
            style={{
              marginTop: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                background: '#71F59B',
                color: '#06180E',
                fontSize: 22,
                fontWeight: 700,
                padding: '12px 28px',
                borderRadius: '999px',
              }}
            >
              Download the app
            </div>
          </div>
        </div>
        <img
          src={iconSrc}
          width={320}
          height={320}
          style={{ borderRadius: '48px' }}
        />
      </div>
    ),
    { ...size }
  )
}
