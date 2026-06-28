'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import classNames from 'classnames';
import styles from './settings-tabs.module.scss';

type SettingsTab = 'account' | 'profile';

type SettingsTabsProps = {
  account: React.ReactNode;
  profile: React.ReactNode;
};

const tabs: { id: SettingsTab; label: string }[] = [
  { id: 'account', label: 'Account' },
  { id: 'profile', label: 'Profile' },
];

export const SettingsTabs = ({ account, profile }: SettingsTabsProps) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [direction, setDirection] = useState(1);
  const tabRefs = useRef<Partial<Record<SettingsTab, HTMLButtonElement>>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const tab = tabRefs.current[activeTab];
      if (tab) setIndicator({ left: tab.offsetLeft, width: tab.offsetWidth });
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab]);

  const selectTab = (nextTab: SettingsTab) => {
    if (nextTab === activeTab) return;
    setDirection(tabs.findIndex(tab => tab.id === nextTab) > tabs.findIndex(tab => tab.id === activeTab) ? 1 : -1);
    setActiveTab(nextTab);
  };

  return (
    <>
      <nav className={styles.nav} aria-label='Settings sections'>
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
            {activeTab === 'account' ? account : profile}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
};
