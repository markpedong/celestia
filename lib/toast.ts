'use client';

import { toast } from 'sonner';

// ponytail: one shared auth toast; add broader helpers only when a second pattern repeats.
export const showSignInToVoteToast = () => toast('Sign in to vote', {
  description: 'Sign in to upvote or downvote posts and comments.',
  action: { label: 'Sign in', onClick: () => window.location.assign('/auth/sign-in') },
  position: typeof window !== "undefined" && window.innerWidth < 1024
    ? "top-center"
    : "bottom-right"
  ,
  duration: 1500
});
