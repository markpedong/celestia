import type { FC } from 'react';
import type { LeftTagsProps } from '@/lib/types';
import Link from 'next/link';
import { formatCount } from '@/lib/utils';
import classNames from 'classnames';
import styles from './left-tags.module.scss';

const LeftTags: FC<LeftTagsProps> = ({ tags, emptyMessage }) => {
  const sorted = [...tags].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <ul className={styles.list}>
      {sorted.length === 0 && emptyMessage ? (
        <li className={styles.empty}>{emptyMessage}</li>
      ) : null}
      {sorted.map(({ tag, count }) => (
        <li key={tag.slug}>
          <Link
            href={`/r/${encodeURIComponent(tag.slug)}`}
            className={classNames('group celestia-hover-surface', styles.link)}
          >
            <span className={styles.labelWrap}>
              <span
                className={styles.dot}
                style={{ background: tag.hashColor, color: tag.hashColor }}
              />
              <span className={styles.label}>{tag.label}</span>
            </span>
            <span className={styles.count}>{formatCount(count)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default LeftTags;
