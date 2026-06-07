import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>
}): Promise<Metadata> {
  const { code } = await params
  return {
    title: '¡Te invitaron a una Quiniela! | Golify',
    description: 'Alguien te invitó a competir en una quiniela de fútbol. Abre Golify y únete ahora.',
    openGraph: {
      title: '¡Te invitaron a una Quiniela en Golify!',
      description: 'Compite con tus amigos en quinielas de fútbol. Abre la app para unirte.',
      siteName: 'Golify',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: '¡Te invitaron a una Quiniela en Golify!',
      description: 'Compite con tus amigos en quinielas de fútbol. Abre la app para unirte.',
    },
    other: {
      'apple-itunes-app': `app-id=6772339872, app-argument=golify://quiniela/join/${code.toUpperCase()}`,
    },
  }
}

export default function QuinielaJoinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
