import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>
}): Promise<Metadata> {
  const { code } = await params
  return {
    title: '¡Te están retando! | Golify',
    description: 'Alguien te lanzó un reto de fútbol en Golify. Abre la app y acepta el desafío.',
    openGraph: {
      title: '¡Te están retando en Golify!',
      description: 'Te lanzaron un reto de fútbol. Abre Golify y acepta el desafío.',
      siteName: 'Golify',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: '¡Te están retando en Golify!',
      description: 'Te lanzaron un reto de fútbol. Abre Golify y acepta el desafío.',
    },
    other: {
      'apple-itunes-app': `app-id=6772339872, app-argument=golify://retas/join/${code.toUpperCase()}`,
    },
  }
}

export default function RetasJoinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
