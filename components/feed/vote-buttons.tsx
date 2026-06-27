'use client';

import type { FC } from 'react';
import { cn, formatCount } from '@/lib/utils';
import type { VoteActionValue, VoteButtonsProps, VoteValue } from '@/lib/types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/hooks/useSession';
import { useVote } from '@/hooks/useQueries';

const VoteButtons: FC<VoteButtonsProps> = ({ target, targetID, score, userVote, isSignedIn = false }) => {
  const router = useRouter();
  const session = useSession().session;
  const voteMutation = useVote();

  const [voteState, setVoteState] = useState({ score, userVote });

  const isPost = target === 'post';
  const hasSession = session === undefined ? isSignedIn : Boolean(session);

  const showSignInToVoteToast = () =>
    toast('Sign in to vote', {
      description: 'Sign in to upvote or downvote posts and comments.',
      action: { label: 'Sign in', onClick: () => window.location.assign('/auth/sign-in') },
      position: typeof window !== 'undefined' && window.innerWidth < 1024 ? 'top-center' : 'bottom-right',
      duration: 1500,
    });

  const vote = (value: VoteActionValue) => {
    if (!hasSession) {
      showSignInToVoteToast();
      return;
    }
    if (voteMutation.isPending) return;

    const previousVoteState = voteState;
    const nextVoteState = {
      userVote: voteState.userVote === value ? 0 : (value as VoteValue),
      score: voteState.score + (voteState.userVote === value ? 0 : value) - voteState.userVote,
    };

    setVoteState(nextVoteState);
    voteMutation.mutate({ target, targetID, value }, {
      onSuccess: result => {
        if (!result.success) {
          setVoteState(previousVoteState);
          if (result.message.toLowerCase().includes('sign in')) showSignInToVoteToast();
          else toast.error(result.message, { position: 'bottom-right' });
          return;
        }

        router.refresh();
      },
      onError: error => {
        setVoteState(previousVoteState);
        toast.error(error instanceof Error ? error.message : 'Unable to vote.', { position: 'bottom-right' });
      },
    });
  };

  const buttonClass = isPost ? 'p-1.5' : 'p-1';
  const scoreClass = isPost ? 'min-w-9 text-xs' : 'min-w-6';

  return (
    <div
      className={cn(
        'inline-flex items-center overflow-hidden text-sm',
        isPost ? 'flex-col gap-0.5 rounded-none border-0 bg-transparent shadow-none' : ''
      )}
    >
      <button
        onClick={() => vote(1)}
        disabled={voteMutation.isPending}
        className={cn(
          'flex items-center rounded-lg transition-all hover:scale-110 hover:bg-muted disabled:opacity-50',
          buttonClass,
          voteState.userVote === 1 ? 'text-upvote' : 'text-muted-foreground hover:text-upvote'
        )}
        aria-label={isPost ? 'Upvote' : 'Upvote comment'}
        aria-pressed={voteState.userVote === 1}
      >
        <ChevronUp className='size-4' />
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
        disabled={voteMutation.isPending}
        className={cn(
          'flex items-center rounded-lg transition-all hover:scale-110 hover:bg-muted disabled:opacity-50',
          buttonClass,
          voteState.userVote === -1 ? 'text-downvote' : 'text-muted-foreground hover:text-downvote'
        )}
        aria-label={isPost ? 'Downvote' : 'Downvote comment'}
        aria-pressed={voteState.userVote === -1}
      >
        <ChevronDown className='size-4' />
      </button>
    </div>
  );
};

export default VoteButtons;
