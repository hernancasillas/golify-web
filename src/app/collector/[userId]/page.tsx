import { redirect } from 'next/navigation';

export default async function CollectorRedirect({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  redirect(`/en/collector/${userId}`);
}
