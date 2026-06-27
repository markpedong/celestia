'use client';

import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, FileText, ImageIcon, Info, UsersRound } from 'lucide-react';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

type CommunityManagementTab = 'overview' | 'details' | 'visuals' | 'members' | 'posts';

type CommunityManagementTabsProps = {
  overview: ReactNode;
  details: ReactNode;
  visuals: ReactNode;
  members: ReactNode;
  posts: ReactNode;
  memberCount: number;
  postCount: number;
};

const tabs: {
  id: CommunityManagementTab;
  label: string;
  icon: typeof BarChart3;
  count?: keyof Pick<CommunityManagementTabsProps, 'memberCount' | 'postCount'>;
}[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'details', label: 'Details', icon: Info },
  { id: 'visuals', label: 'Visuals', icon: ImageIcon },
  { id: 'members', label: 'Members', icon: UsersRound, count: 'memberCount' },
  { id: 'posts', label: 'Posts', icon: FileText, count: 'postCount' },
];

export const CommunityManagementTabs = ({
  overview,
  details,
  visuals,
  members,
  posts,
  memberCount,
  postCount,
}: CommunityManagementTabsProps) => {
  const panels = { overview, details, visuals, members, posts };
  const counts = { memberCount, postCount };
  const [activeTab, setActiveTab] = useState<CommunityManagementTab>('overview');
  const [direction, setDirection] = useState(1);
  const tabRefs = useRef<Partial<Record<CommunityManagementTab, HTMLButtonElement>>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const tab = tabRefs.current[activeTab];
      if (tab) setIndicator({ left: tab.offsetLeft, width: tab.offsetWidth });
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab]);

  const selectTab = (nextTab: CommunityManagementTab) => {
    if (nextTab === activeTab) return;
    setDirection(tabs.findIndex(tab => tab.id === nextTab) > activeIndex ? 1 : -1);
    setActiveTab(nextTab);
  };

  return (
    <section className='celestia-card overflow-hidden'>
      <nav
        className='relative flex overflow-x-auto border-b border-border/80 bg-muted/20 px-2 text-sm font-semibold'
        aria-label='Community management sections'
      >
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              ref={element => {
                if (element) tabRefs.current[tab.id] = element;
              }}
              type='button'
              aria-current={activeTab === tab.id ? 'page' : undefined}
              onClick={() => selectTab(tab.id)}
              className={cn(
                'relative inline-flex h-12 shrink-0 items-center gap-2 px-3 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset md:px-4',
                activeTab === tab.id ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className='size-4' />
              {tab.label}
              {tab.count ? (
                <span className='rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground'>
                  {counts[tab.count]}
                </span>
              ) : null}
            </button>
          );
        })}
        <span
          aria-hidden='true'
          className='pointer-events-none absolute bottom-0 left-0 h-0.5 bg-primary transition-[transform,width] duration-200 ease-out'
          style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
        />
      </nav>
      <div className='relative overflow-hidden p-4 md:p-5'>
        <AnimatePresence initial={false} mode='popLayout' custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            initial='enter'
            animate='center'
            exit='exit'
            variants={{
              enter: (travelDirection: number) => ({ opacity: 0, x: travelDirection * 24 }),
              center: { opacity: 1, x: 0 },
              exit: (travelDirection: number) => ({ opacity: 0, x: travelDirection * -24 }),
            }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            {panels[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
