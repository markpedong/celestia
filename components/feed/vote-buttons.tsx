'use client';

import { voteCommentAction } from '@/lib/actions/comments';
import { votePostAction } from '@/lib/actions/posts';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

type Props = {
  target: string;
  targetID: string;
  score: number;
  userVote: -1 | 0 | 1;
};

const formatScore = (value: number): string => {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
};

const VoteButtons = ({ target, targetID, score, userVote }: Props) => {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const isPost = target === 'post';

  const vote = (value: -1 | 1) => {
    startTransition(async () => {
      if (isPost) {
        await votePostAction(targetID, value);
      } else {
        await voteCommentAction(targetID, value);
      }
      router.refresh();
    });
  };

  const iconClass = isPost ? 'size-4' : 'size-3.5';
  const buttonClass = isPost ? 'px-2 py-1.5' : 'px-1.5 py-1';
  const scoreClass = isPost ? 'min-w-10 px-1 text-xs' : 'min-w-8 px-1 text-[11px]';

  return (
    <div className='celestia-surface-control inline-flex items-center overflow-hidden text-sm'>
      <button
        onClick={() => vote(1)}
        disabled={pending}
        className={cn(
          'flex items-center transition-colors hover:bg-white/5 disabled:opacity-50',
          buttonClass,
          userVote === 1 ? 'text-upvote' : 'text-muted-foreground hover:text-upvote'
        )}
        aria-label={isPost ? 'Upvote' : 'Upvote comment'}
      >
        <ChevronUp className={iconClass} />
      </button>
      <span className={cn('text-center font-mono font-medium tabular-nums', scoreClass, userVote === 1 && 'text-upvote', userVote === -1 && 'text-downvote')}>
        {formatScore(score)}
      </span>
      <button
        onClick={() => vote(-1)}
        disabled={pending}
        className={cn(
          'flex items-center transition-colors hover:bg-white/5 disabled:opacity-50',
          buttonClass,
          userVote === -1 ? 'text-downvote' : 'text-muted-foreground hover:text-downvote'
        )}
        aria-label={isPost ? 'Downvote' : 'Downvote comment'}
      >
        <ChevronDown className={iconClass} />
      </button>
    </div>
  );
};

export default VoteButtons;
