'use client';

import { useLayoutEffect, useRef, useState, type FC } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import classNames from 'classnames';
import type { ProfileActivityTab, ProfileActivityTabsProps } from '@/lib/types';
import styles from './profile-activity-tabs.module.scss';

const tabs: { id: ProfileActivityTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'posts', label: 'Posts' },
  { id: 'comments', label: 'Comments' },
  { id: 'upvoted', label: 'Upvoted' },
  { id: 'downvoted', label: 'Downvoted' },
];

export const ProfileActivityTabs: FC<ProfileActivityTabsProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ProfileActivityTab>('overview');
  const [direction, setDirection] = useState(1);
  const tabRefs = useRef<Partial<Record<ProfileActivityTab, HTMLButtonElement>>>({});
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

  const selectTab = (nextTab: ProfileActivityTab) => {
    if (nextTab === activeTab) return;
    setDirection(tabs.findIndex(tab => tab.id === nextTab) > activeIndex ? 1 : -1);
    setActiveTab(nextTab);
  };

  return (
    <>
      <nav className={styles.nav} aria-label='Profile sections'>
        {tabs.map(tab => (
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
            {tab.label}
          </button>
        ))}
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
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {children[activeIndex]}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
};
