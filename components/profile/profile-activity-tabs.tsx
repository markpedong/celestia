import type { FC } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ProfileActivityTab, ProfileActivityTabsProps } from '@/lib/types';

const tabs: { id: ProfileActivityTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'posts', label: 'Posts' },
  { id: 'comments', label: 'Comments' },
  { id: 'upvoted', label: 'Upvoted' },
  { id: 'downvoted', label: 'Downvoted' },
];

export const ProfileActivityTabs: FC<ProfileActivityTabsProps> = ({ activeTab, children, username }) => {
  return (
    <>
      <nav className='mb-4 flex overflow-x-auto border-b border-border/80 text-sm font-semibold' aria-label='Profile sections'>
        {tabs.map(tab => (
          <Link
            key={tab.id}
            href={tab.id === 'overview' ? `/u/${encodeURIComponent(username)}` : `/u/${encodeURIComponent(username)}?tab=${tab.id}`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            className={cn(
              'shrink-0 border-b-2 px-4 py-2.5 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground',
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <div>{children}</div>
    </>
  );
};
