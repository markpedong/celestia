'use client';

import { voteCommentAction } from '@/lib/actions/comments';
import { votePostAction } from '@/lib/actions/posts';
import { cn } from '@/lib/utils';
import type { VoteActionValue, VoteButtonsProps, VoteValue } from '@/lib/types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useOptimistic, useTransition } from 'react';

const formatScore = (value: number): string => {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
};

const VoteButtons = ({ target, targetID, score, userVote }: VoteButtonsProps) => {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const isPost = target === 'post';
  const [optimisticVote, setOptimisticVote] = useOptimistic(
    { score, userVote },
    (current, value: VoteActionValue) => {
      const nextVote: VoteValue = current.userVote === value ? 0 : value;
      return {
        userVote: nextVote,
        score: current.score + nextVote - current.userVote,
      };
    },
  );

  const vote = (value: VoteActionValue) => {
    startTransition(async () => {
      setOptimisticVote(value);
      const result = isPost
        ? await votePostAction(targetID, value)
        : await voteCommentAction(targetID, value);

      if (result?.error) {
        router.refresh();
      }
    });
  };

  const iconClass = isPost ? 'size-4' : 'size-3.5';
  const buttonClass = isPost ? 'p-1.5' : 'p-1';
  const scoreClass = isPost ? 'min-w-9 text-xs' : 'min-w-8 text-[11px]';

  return (
    <div className={cn('inline-flex items-center overflow-hidden text-sm', isPost ? 'flex-col gap-0.5 rounded-none border-0 bg-transparent shadow-none' : 'celestia-surface-control')}>
      <button
        onClick={() => vote(1)}
        disabled={pending}
        className={cn(
          'flex items-center rounded-lg transition-all hover:scale-110 hover:bg-muted disabled:opacity-50',
          buttonClass,
          optimisticVote.userVote === 1 ? 'text-upvote' : 'text-muted-foreground hover:text-upvote'
        )}
        aria-label={isPost ? 'Upvote' : 'Upvote comment'}
      >
        <ChevronUp className={iconClass} />
      </button>
      <span className={cn('text-center font-mono font-medium tabular-nums', scoreClass, optimisticVote.userVote === 1 && 'text-upvote', optimisticVote.userVote === -1 && 'text-downvote')}>
        {formatScore(optimisticVote.score)}
      </span>
      <button
        onClick={() => vote(-1)}
        disabled={pending}
        className={cn(
          'flex items-center rounded-lg transition-all hover:scale-110 hover:bg-muted disabled:opacity-50',
          buttonClass,
          optimisticVote.userVote === -1 ? 'text-downvote' : 'text-muted-foreground hover:text-downvote'
        )}
        aria-label={isPost ? 'Downvote' : 'Downvote comment'}
      >
        <ChevronDown className={iconClass} />
      </button>
    </div>
  );
};

export default VoteButtons;
