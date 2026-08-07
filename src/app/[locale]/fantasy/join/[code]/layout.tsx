import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>
}): Promise<Metadata> {
  const { code } = await params
  return {
    title: '¡Te invitaron a una Liga Fantasy! | Golify',
    description: 'Alguien te invitó a una liga fantasy en Golify. Abre la app para unirte.',
    openGraph: {
      title: '¡Te invitaron a una Liga Fantasy en Golify!',
      description: 'Únete a la liga fantasy y compite con tus amigos.',
      siteName: 'Golify',
      type: 'website',
    },
    other: {
      'apple-itunes-app': `app-id=6772339872, app-argument=golify://fantasy/join/${code.toUpperCase()}`,
    },
  }
}

export default function FantasyJoinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
