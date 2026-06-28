import type { FC } from 'react';
import Link from 'next/link';
import { ActiveNowDynamic } from '@/components/dynamic-import';
import type { RightTrendingProps } from '@/lib/types';
import { Flame, Minus, Sparkles, TrendingUp, Users } from 'lucide-react';
import classNames from 'classnames';
import Image from 'next/image';
import styles from './right-trending.module.scss';

export const RightTrending: FC<RightTrendingProps> = ({ items, communities }) => {
  return (
    <div className={styles.root}>
    <section className={classNames('celestia-card', styles.section)}>
      <h3 className={styles.heading}>
        <TrendingUp className={classNames(styles.headingIcon, styles.primaryIcon)} />
        Trending Posts
      </h3>
      <div className={styles.list}>
        {items.map((t, index) => (
          <Link key={t.rank} href={`/?q=${encodeURIComponent(t.title)}`} className={classNames('celestia-hover-surface', styles.postLink)}>
            <span className={styles.rank}>{t.rank}</span>
            <div className={styles.postBody}>
              <p className={styles.postTitle}>
                {t.title}
              </p>
              <p className={styles.postCount}>{t.postCount} posts</p>
            </div>
            {index === 0 ? <Flame className={classNames(styles.rankIcon, styles.hotIcon)} /> : index === 1 ? <TrendingUp className={classNames(styles.rankIcon, styles.successIcon)} /> : index === 2 ? <Sparkles className={classNames(styles.rankIcon, styles.primaryIcon)} /> : <Minus className={classNames(styles.rankIcon, styles.mutedIcon)} />}
          </Link>
        ))}
        <Link href='/explore' className={styles.viewAll}>
          View all
        </Link>
      </div>
    </section>
    <ActiveNowDynamic />
    <section className={classNames('celestia-card', styles.section)}>
      <h3 className={styles.heading}>
        <Users className={classNames(styles.headingIcon, styles.accentIcon)} />
        Top Communities
      </h3>
      <div className={styles.communityList}>
        {communities.slice(0, 3).map((community) => (
          <Link key={community.slug} href={`/r/${encodeURIComponent(community.slug)}`} className={classNames('celestia-hover-surface', styles.communityLink)}>
            <span className={styles.avatar}>
              {community.avatarUrl ? (
                <Image
                  src={community.avatarUrl}
                  width={32}
                  height={32}
                  className={styles.avatarImage}
                  alt={`${community.label} avatar`}
                />
              ) : (
                <span style={{ color: community.hashColor }}>{community.label[0]}</span>
              )}
            </span>
            <div className={styles.communityBody}>
              <p className={styles.communitySlug}>r/{community.slug}</p>
              <p className={styles.communityCount}>{community.postCount} posts</p>
            </div>
            <span className={styles.meter} />
          </Link>
        ))}
      </div>
    </section>
    </div>
  );
};
