'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, FileText, Flag, ImageIcon, Info, UsersRound } from 'lucide-react';
import classNames from 'classnames';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import styles from './community-management-tabs.module.scss';

type CommunityManagementTab = 'overview' | 'details' | 'visuals' | 'members' | 'posts' | 'reports';

type CommunityManagementTabsProps = {
  overview: ReactNode;
  details: ReactNode;
  visuals: ReactNode;
  members: ReactNode;
  posts: ReactNode;
  reports: ReactNode;
  memberCount: number;
  postCount: number;
  reportCount: number;
};

const tabs: {
  id: CommunityManagementTab;
  label: string;
  icon: typeof BarChart3;
  count?: keyof Pick<CommunityManagementTabsProps, 'memberCount' | 'postCount' | 'reportCount'>;
}[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'details', label: 'Details', icon: Info },
  { id: 'visuals', label: 'Visuals', icon: ImageIcon },
  { id: 'members', label: 'Members', icon: UsersRound, count: 'memberCount' },
  { id: 'posts', label: 'Posts', icon: FileText, count: 'postCount' },
  { id: 'reports', label: 'Reports', icon: Flag, count: 'reportCount' },
];

export const CommunityManagementTabs = ({
  overview,
  details,
  visuals,
  members,
  posts,
  reports,
  memberCount,
  postCount,
  reportCount,
}: CommunityManagementTabsProps) => {
  const panels = { overview, details, visuals, members, posts, reports };
  const counts = { memberCount, postCount, reportCount };
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
    <section className={classNames('celestia-card', styles.card)}>
      <nav
        className={styles.nav}
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
              className={classNames(styles.tab, {
                [styles.activeTab]: activeTab === tab.id,
              })}
            >
              <Icon className={styles.icon} />
              {tab.label}
              {tab.count ? (
                <span className={styles.count}>
                  {counts[tab.count]}
                </span>
              ) : null}
            </button>
          );
        })}
        <span
          aria-hidden='true'
          className={styles.indicator}
          style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
        />
      </nav>
      <div className={styles.panel}>
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
