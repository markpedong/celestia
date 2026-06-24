import { getSessionUser } from '@/lib/auth';
import { getCommunityBySlug } from '@/lib/db/queries';
import type { CommunitySettingsPageProps } from '@/lib/types';
import { notFound, redirect } from 'next/navigation';

const CommunitySettingsPage = async ({ params }: CommunitySettingsPageProps) => {
  const { slug: rawSlug } = await params;
  const [community, user] = await Promise.all([
    getCommunityBySlug(decodeURIComponent(rawSlug).toLowerCase()),
    getSessionUser(),
  ]);
  if (!community) notFound();

  if (!user) redirect('/auth/sign-in');
  if (community.createdByID !== user.id) redirect(`/r/${community.slug}`);

  return (
    <main className='mx-auto w-full max-w-2xl px-4 py-8 md:py-12'>
      <p className='text-sm font-medium text-primary'>Community owner tools</p>
      <h1 className='mt-1 text-3xl font-bold tracking-tight'>Manage r/{community.slug}</h1>
      <p className='mt-2 mb-6 text-sm leading-6 text-muted-foreground'>Update the public identity of your community. Only its creator can access these controls.</p>
      {/* <CommunitySettingsForm community={community} /> */}
    </main>
  );
};

export default CommunitySettingsPage;
