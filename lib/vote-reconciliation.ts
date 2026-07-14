import type { VoteActionValue, VoteValue } from '@/lib/types';

export type ReconciledVoteState = { score: number; userVote: VoteValue };

export const desiredVoteAfterClick = (current: VoteValue, clicked: VoteActionValue): VoteValue =>
  current === clicked ? 0 : clicked;

export const reconcileVote = async (
  initial: ReconciledVoteState,
  getDesired: () => VoteValue,
  submit: (desired: VoteValue) => Promise<ReconciledVoteState>,
) => {
  let confirmed = initial;
  while (confirmed.userVote !== getDesired()) {
    const desired = getDesired();
    confirmed = await submit(desired);
  }
  return confirmed;
};
