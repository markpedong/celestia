'use client';

import { useGetOwnedCommunities, useGetProfile } from '@/hooks/useQueries';
import { Settings } from 'lucide-react';
import Link from 'next/link';

export const ProfileManagedCommunities = ({ profileID }: { profileID: string }) => {
  const currentProfile = useGetProfile().data?.data;
  const isOwnProfile = currentProfile?.id === profileID;
  const { data } = useGetOwnedCommunities(profileID, isOwnProfile);
  const communities = data?.data ?? [];

  if (!isOwnProfile || !communities.length) return null;

  return (
    <section className='celestia-card p-4'>
      <h2 className='mb-3 text-sm font-semibold'>Communities you manage</h2>
      <div className='space-y-2'>
        {communities.map(community => (
          <Link
            key={community.slug}
            href={`/settings/communities/${encodeURIComponent(community.slug)}`}
            className='flex items-center justify-between gap-3 rounded border border-border bg-muted/30 px-3 py-2 text-xs transition-colors hover:bg-muted'
          >
            <span className='min-w-0'>
              <span className='block truncate font-medium text-foreground'>r/{community.slug}</span>
              <span className='block truncate text-muted-foreground'>{community.label}</span>
            </span>
            <span className='inline-flex shrink-0 items-center gap-1 font-medium text-primary'>
              <Settings className='size-3.5' /> Manage
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};
