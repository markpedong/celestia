import { formatCount } from '@/lib/format';
import { Tag } from '@/lib/types';
import Link from 'next/link';
type Props = { tags: { tag: Tag; count: number }[] };

const LeftTags = ({ tags }: Props) => {
  const sorted = [...tags].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <ul className='space-y-1'>
      {sorted.map(({ tag, count }) => (
        <li key={tag.slug}>
          <Link
            href={`/?tag=${encodeURIComponent(tag.slug)}`}
            className='group flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-white/5 hover:text-foreground'
          >
            <span className='flex min-w-0 items-center gap-2.5'>
              <span
                className='size-1.5 shrink-0 rounded-full shadow-[0_0_6px_currentColor]'
                style={{ background: tag.hashColor, color: tag.hashColor }}
              />
              <span className='truncate text-muted-foreground group-hover:text-foreground'>{tag.label}</span>
            </span>
            <span className='shrink-0 font-mono text-xs text-muted-foreground/70'>{formatCount(count)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default LeftTags;
