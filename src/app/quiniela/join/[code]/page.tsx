import { redirect } from 'next/navigation';

export default async function QuinielaJoinRedirect({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  // Redirect to English by default, could detect language from headers
  redirect(`/en/quiniela/join/${code}`);
}
