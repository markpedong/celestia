import CommunitySettingsForm from '@/components/community/community-settings-form';
import { RightTrending } from '@/components/layout/right-trending';
import { getSessionUser } from '@/lib/auth';
import { getPublicShellData } from '@/lib/public-data';
import type { CommunitySettingsPageProps } from '@/lib/types';
import { getCommunity } from '@/services';
import { ArrowLeft, Settings } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

const CommunitySettingsPage = async ({ params }: CommunitySettingsPageProps) => {
  const { slug: rawSlug } = await params;
  const [community, user, shellData] = await Promise.all([
    getCommunity(decodeURIComponent(rawSlug).toLowerCase()),
    getSessionUser(),
    getPublicShellData(),
  ]);
  if (!community) notFound();

  if (!user) redirect('/auth/sign-in');
  if (community.createdByID !== user.id) redirect(`/r/${community.slug}`);

  return (
    <main className='mx-auto w-full max-w-5xl px-4 py-6 md:py-10'>
      <Link href={`/r/${community.slug}`} className='mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground'>
        <ArrowLeft className='size-4' /> Back to community
      </Link>
      <div className='relative'>
        <section className='celestia-card mb-6 overflow-hidden'>
          <div className='relative min-h-44 border-b border-border/70 md:min-h-56'>
            {community.coverUrl ? (
              <Image src={community.coverUrl} alt={`${community.label} cover`} fill unoptimized className='object-cover' />
            ) : (
              <div
                className='size-full'
                style={{
                  background: `
                    radial-gradient(circle at 18% 24%, ${community.hashColor}90, transparent 34%),
                    linear-gradient(135deg, ${community.hashColor}66, color-mix(in srgb, var(--accent) 22%, transparent))
                  `,
                }}
              />
            )}
            <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,20,0.08)_0%,rgba(5,8,20,0.76)_100%)]' />
            <div className='absolute inset-x-0 bottom-0 flex items-end gap-4 p-5 md:p-6'>
              <span
                className='relative grid size-20 shrink-0 place-items-center overflow-hidden rounded border border-white/20 text-2xl font-black text-primary-foreground shadow-2xl md:size-24'
                style={{ backgroundColor: community.hashColor }}
              >
                {community.avatarUrl ? (
                  <Image src={community.avatarUrl} alt={`${community.label} profile`} fill unoptimized className='object-cover' />
                ) : (
                  community.label.slice(0, 1).toUpperCase()
                )}
              </span>
              <div className='min-w-0 text-white'>
                <p className='inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-white/70'>
                  <Settings className='size-3.5' /> Owner tools
                </p>
                <h1 className='mt-1 truncate text-3xl font-black tracking-tight md:text-4xl'>Manage r/{community.slug}</h1>
              </div>
            </div>
          </div>
          <div className='p-5 text-sm leading-6 text-muted-foreground md:p-6'>
            Update the public identity, cover image, profile image, and color system for your community.
          </div>
        </section>
        <CommunitySettingsForm community={community} />
        <aside className='absolute top-0 left-[calc(100%+1.5rem)] hidden w-72 2xl:block'>
          <div className='sticky top-20'>
            <RightTrending items={shellData.trending} communities={shellData.communities} />
          </div>
        </aside>
      </div>
    </main>
  );
};

export default CommunitySettingsPage;
