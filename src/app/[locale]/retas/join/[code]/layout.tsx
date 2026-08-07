import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>
}): Promise<Metadata> {
  const { code } = await params
  return {
    title: '¡Te invitaron a una Reta! | Golify',
    description: 'Alguien te invitó a una reta en Golify. Abre la app para unirte.',
    openGraph: {
      title: '¡Te invitaron a una Reta en Golify!',
      description: 'Cáele a la reta y compite con tus amigos.',
      siteName: 'Golify',
      type: 'website',
    },
    other: {
      'apple-itunes-app': `app-id=6772339872, app-argument=golify://retas/join/${code.toUpperCase()}`,
    },
  }
}

export default function RetasJoinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
