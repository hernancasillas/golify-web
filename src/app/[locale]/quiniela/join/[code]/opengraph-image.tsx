import { ImageResponse } from 'next/og'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const alt = '¡Te invitaron a una Quiniela en Golify!'
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: '#71F59B',
              textTransform: 'uppercase',
              letterSpacing: '3px',
            }}
          >
            Golify
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.05,
              letterSpacing: '-2px',
            }}
          >
            ¡Te invitaron a una Quiniela!
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 400,
              color: '#ffffff',
              opacity: 0.7,
              lineHeight: 1.4,
              marginTop: '8px',
            }}
          >
            Abre Golify y demuestra que sabes de fútbol
          </div>
          <div
            style={{
              marginTop: '28px',
              background: '#71F59B',
              color: '#06180E',
              fontSize: 22,
              fontWeight: 700,
              padding: '12px 28px',
              borderRadius: '999px',
              display: 'flex',
              alignSelf: 'flex-start',
            }}
          >
            Unirse ahora
          </div>
        </div>
        <img
          src={iconSrc}
          width={260}
          height={260}
          style={{ borderRadius: '40px', marginLeft: '60px' }}
        />
      </div>
    ),
    { ...size }
  )
}
