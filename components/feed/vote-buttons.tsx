'use client';

import type { FC } from 'react';
import { voteCommentAction } from '@/lib/actions/comments';
import { votePostAction } from '@/lib/actions/posts';
import { showSignInToVoteToast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { formatCount } from '@/lib/format';
import type { VoteActionValue, VoteButtonsProps, VoteValue } from '@/lib/types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/hooks/useSession';

const VoteButtons: FC<VoteButtonsProps> = ({ target, targetID, score, userVote, isSignedIn = false }) => {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const isPost = target === 'post';
  const { session } = useSession();
  const hasSession = session === undefined ? isSignedIn : Boolean(session);
  const [voteState, setVoteState] = useState({ score, userVote });

  const vote = (value: VoteActionValue) => {
    if (!hasSession) {
      showSignInToVoteToast();
      return;
    }
    if (pending) return;

    const previousVoteState = voteState;
    const nextVoteState = {
      userVote: voteState.userVote === value ? 0 : value as VoteValue,
      score: voteState.score + (voteState.userVote === value ? 0 : value) - voteState.userVote,
    };

    setVoteState(nextVoteState);
    startTransition(async () => {
      const result = isPost ? await votePostAction(targetID, value) : await voteCommentAction(targetID, value);

      if (result?.error) {
        setVoteState(previousVoteState);
        if (result.error.toLowerCase().includes('sign in')) {
          showSignInToVoteToast();
        } else {
          toast.error(result.error, { position: 'bottom-right' });
        }
        return;
      }

      router.refresh();
    });
  };

  const iconClass = isPost ? 'size-4' : 'size-3.5';
  const buttonClass = isPost ? 'p-1.5' : 'p-1';
  const scoreClass = isPost ? 'min-w-9 text-xs' : 'min-w-8 text-[11px]';

  return (
    <div
      className={cn(
        'inline-flex items-center overflow-hidden text-sm',
        isPost ? 'flex-col gap-0.5 rounded-none border-0 bg-transparent shadow-none' : 'celestia-surface-control'
      )}
    >
      <button
        onClick={() => vote(1)}
        disabled={pending}
        className={cn(
          'flex items-center rounded-lg transition-all hover:scale-110 hover:bg-muted disabled:opacity-50',
          buttonClass,
          voteState.userVote === 1 ? 'text-upvote' : 'text-muted-foreground hover:text-upvote'
        )}
        aria-label={isPost ? 'Upvote' : 'Upvote comment'}
        aria-pressed={voteState.userVote === 1}
      >
        <ChevronUp className={iconClass} />
      </button>
      <span
        className={cn(
          'text-center font-mono font-medium tabular-nums',
          scoreClass,
          voteState.userVote === 1 && 'text-upvote',
          voteState.userVote === -1 && 'text-downvote'
        )}
      >
        {formatCount(voteState.score)}
      </span>
      <button
        onClick={() => vote(-1)}
        disabled={pending}
        className={cn(
          'flex items-center rounded-lg transition-all hover:scale-110 hover:bg-muted disabled:opacity-50',
          buttonClass,
          voteState.userVote === -1 ? 'text-downvote' : 'text-muted-foreground hover:text-downvote'
        )}
        aria-label={isPost ? 'Downvote' : 'Downvote comment'}
        aria-pressed={voteState.userVote === -1}
      >
        <ChevronDown className={iconClass} />
      </button>
    </div>
  );
};

export default VoteButtons;
