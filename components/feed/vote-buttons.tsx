'use client';

import type { FC } from 'react';
import { formatCount } from '@/lib/utils';
import type { VoteActionValue, VoteButtonsProps, VoteValue } from '@/lib/types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import classNames from 'classnames';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/hooks/useSession';
import { useVote } from '@/hooks/useQueries';
import styles from './vote-buttons.module.scss';

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

  return (
    <div
      className={classNames(styles.root, {
        [styles.postRoot]: isPost,
      })}
    >
      <button
        onClick={() => vote(1)}
        disabled={voteMutation.isPending}
        className={classNames(
          styles.button,
          styles.commentButton,
          styles.upvoteInactive,
          {
            [styles.postButton]: isPost,
            [styles.upvoteActive]: voteState.userVote === 1,
          }
        )}
        aria-label={isPost ? 'Upvote' : 'Upvote comment'}
        aria-pressed={voteState.userVote === 1}
      >
        <ChevronUp className={styles.icon} />
      </button>
      <span
        className={classNames(
          styles.score,
          styles.commentScore,
          {
            [styles.postScore]: isPost,
            [styles.upvoteActive]: voteState.userVote === 1,
            [styles.downvoteActive]: voteState.userVote === -1,
          }
        )}
      >
        {formatCount(voteState.score)}
      </span>
      <button
        onClick={() => vote(-1)}
        disabled={voteMutation.isPending}
        className={classNames(
          styles.button,
          styles.commentButton,
          styles.downvoteInactive,
          {
            [styles.postButton]: isPost,
            [styles.downvoteActive]: voteState.userVote === -1,
          }
        )}
        aria-label={isPost ? 'Downvote' : 'Downvote comment'}
        aria-pressed={voteState.userVote === -1}
      >
        <ChevronDown className={styles.icon} />
      </button>
    </div>
  );
};

export default VoteButtons;
