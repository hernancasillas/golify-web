import { redirect } from 'next/navigation';

export default async function LocalJoinRedirect({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  redirect(`/en/local/join/${code}`);
}
