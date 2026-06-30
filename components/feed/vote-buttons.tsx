'use client';

import type { FC } from 'react';
import { formatCount } from '@/lib/utils';
import type { VoteActionValue, VoteButtonsProps } from '@/lib/types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import classNames from 'classnames';
import { toast } from 'sonner';
import { useSession } from '@/hooks/useSession';
import { useVotePost } from '@/components/providers/vote-provider';
import styles from './vote-buttons.module.scss';

const VoteButtons: FC<VoteButtonsProps> = ({ target, targetID, score, userVote, isSignedIn = false }) => {
  const session = useSession().session;
  const { voteState, vote: votePost } = useVotePost(target, targetID, { score, userVote });

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

    votePost(value, showSignInToVoteToast);
  };

  return (
    <div
      className={classNames(styles.root, {
        [styles.postRoot]: isPost,
      })}
    >
      <button
        onClick={() => vote(1)}
        data-allow-rapid-click='true'
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
        data-allow-rapid-click='true'
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
