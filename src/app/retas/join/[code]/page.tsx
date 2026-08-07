import { redirect } from 'next/navigation';

export default async function RetasJoinRedirect({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  redirect(`/en/retas/join/${code}`);
}
