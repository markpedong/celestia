import { formatCount } from '@/lib/format';
import type { LeftTagsProps } from '@/lib/types';
import Link from 'next/link';

const LeftTags = ({ tags, emptyMessage }: LeftTagsProps) => {
  const sorted = [...tags].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <ul className='space-y-1'>
      {sorted.length === 0 && emptyMessage ? (
        <li className='px-3 py-2 text-xs leading-5 text-muted-foreground'>{emptyMessage}</li>
      ) : null}
      {sorted.map(({ tag, count }) => (
        <li key={tag.slug}>
          <Link
            href={`/r/${encodeURIComponent(tag.slug)}`}
            className='group flex items-center justify-between gap-2 rounded px-3 py-2 text-sm celestia-hover-surface'
          >
            <span className='flex min-w-0 items-center gap-2.5'>
              <span
                className='size-1.5 shrink-0 rounded-full shadow-[0_0_6px_currentColor]'
                style={{ background: tag.hashColor, color: tag.hashColor }}
              />
              <span className='truncate text-muted-foreground hover:text-foreground'>{tag.label}</span>
            </span>
            <span className='shrink-0 font-mono text-xs text-muted-foreground/70'>{formatCount(count)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default LeftTags;
