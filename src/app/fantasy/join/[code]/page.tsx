import { redirect } from 'next/navigation';

export default async function FantasyJoinRedirect({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  redirect(`/en/fantasy/join/${code}`);
}
