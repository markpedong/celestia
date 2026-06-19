'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'posts' | 'comments';

type Props = {
  overview: ReactNode;
  posts: ReactNode;
  comments: ReactNode;
};

const tabs: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'posts', label: 'Posts' },
  { id: 'comments', label: 'Comments' },
];

export function ProfileActivityTabs({ overview, posts, comments }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const content = { overview, posts, comments };

  return (
    <>
      <div className='mb-4 flex border-b border-border/80 text-sm font-semibold' role='tablist' aria-label='Profile sections'>
        {tabs.map(tab => (
          <button
            key={tab.id}
            type='button'
            role='tab'
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'border-b-2 px-4 py-2.5 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role='tabpanel'>{content[activeTab]}</div>
    </>
  );
}
