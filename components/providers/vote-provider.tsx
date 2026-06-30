'use client';

import { vote as submitVote } from '@/services';
import type { VoteActionValue, VoteTarget, VoteValue, WithChildren } from '@/lib/types';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

type VoteState = {
  score: number;
  userVote: VoteValue;
};

type PendingVote = {
  target: VoteTarget;
  targetID: string;
  desiredVote: VoteValue;
  confirmed: VoteState;
  inFlight: boolean;
  onSignInRequired: () => void;
};

type VoteContextValue = {
  getVoteState: (target: VoteTarget, targetID: string, fallback: VoteState) => VoteState;
  vote: (input: {
    target: VoteTarget;
    targetID: string;
    value: VoteActionValue;
    current: VoteState;
    onSignInRequired: () => void;
  }) => void;
};

const VoteContext = createContext<VoteContextValue | null>(null);

const voteKey = (target: VoteTarget, targetID: string) => `${target}:${targetID}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isVoteValue = (value: unknown): value is VoteValue => value === -1 || value === 0 || value === 1;

const isMatchingVoteRow = (value: Record<string, unknown>, target: VoteTarget, targetID: string) => {
  if (typeof value.score !== 'number' || !isVoteValue(value.userVote)) return false;
  if (target === 'post') return isRecord(value.post) && value.post.id === targetID;
  return value.id === targetID && typeof value.postID === 'string';
};

const patchVoteData = (value: unknown, target: VoteTarget, targetID: string, next: VoteState): unknown => {
  if (Array.isArray(value)) {
    let changed = false;
    const patched = value.map(item => {
      const nextItem = patchVoteData(item, target, targetID, next);
      if (nextItem !== item) changed = true;
      return nextItem;
    });
    return changed ? patched : value;
  }

  if (!isRecord(value)) return value;

  if (isMatchingVoteRow(value, target, targetID)) {
    return { ...value, score: next.score, userVote: next.userVote };
  }

  let changed = false;
  const patched: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const nextItem = patchVoteData(item, target, targetID, next);
    patched[key] = nextItem;
    if (nextItem !== item) changed = true;
  }

  return changed ? patched : value;
};

export const VoteProvider = ({ children }: WithChildren) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pendingVotes = useRef(new Map<string, PendingVote>());
  const optimisticVotesRef = useRef<Record<string, VoteState>>({});
  const [optimisticVotes, setOptimisticVotes] = useState<Record<string, VoteState>>({});

  const applyVoteState = useCallback((target: VoteTarget, targetID: string, next: VoteState) => {
    const key = voteKey(target, targetID);
    optimisticVotesRef.current = { ...optimisticVotesRef.current, [key]: next };
    setOptimisticVotes(current => ({ ...current, [key]: next }));

    for (const query of queryClient.getQueryCache().findAll()) {
      queryClient.setQueryData(query.queryKey, current => {
        const patched = patchVoteData(current, target, targetID, next);
        return patched === current ? current : patched;
      });
    }
  }, [queryClient]);

  const refetchVoteData = useCallback(() => {
    void queryClient.invalidateQueries({
      predicate: query => query.queryKey.some(part => typeof part === 'string' && (
        part.includes('feed') ||
        part.includes('post') ||
        part.includes('comment') ||
        part.includes('profile')
      )),
    });
    router.refresh();
  }, [queryClient, router]);

  const flushVote = useCallback(async (key: string) => {
    const pending = pendingVotes.current.get(key);
    if (!pending || pending.inFlight) return;

    pending.inFlight = true;

    try {
      while (pending.confirmed.userVote !== pending.desiredVote) {
        const action = pending.desiredVote === 0 ? pending.confirmed.userVote : pending.desiredVote;
        if (action === 0) break;

        const response = await submitVote({
          target: pending.target,
          targetID: pending.targetID,
          value: action,
        });

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Unable to vote.');
        }

        const previousVote = pending.confirmed.userVote;
        pending.confirmed = {
          userVote: response.data.userVote,
          score: pending.confirmed.score + response.data.userVote - previousVote,
        };
      }

      applyVoteState(pending.target, pending.targetID, pending.confirmed);
      refetchVoteData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to vote.';
      applyVoteState(pending.target, pending.targetID, pending.confirmed);
      refetchVoteData();
      if (message.toLowerCase().includes('sign in')) pending.onSignInRequired();
      else toast.error(message, { position: 'bottom-right' });
    } finally {
      pendingVotes.current.delete(key);
    }
  }, [applyVoteState, refetchVoteData]);

  const contextValue = useMemo<VoteContextValue>(() => ({
    getVoteState: (target, targetID, fallback) => optimisticVotes[voteKey(target, targetID)] ?? fallback,
    vote: ({ target, targetID, value, current, onSignInRequired }) => {
      const key = voteKey(target, targetID);
      const existing = pendingVotes.current.get(key);
      const visible = optimisticVotesRef.current[key] ?? current;
      const desiredVote: VoteValue = visible.userVote === value ? 0 : value;
      const next = {
        userVote: desiredVote,
        score: visible.score + desiredVote - visible.userVote,
      };

      if (!existing && current.userVote === desiredVote) return;

      if (existing) {
        existing.desiredVote = desiredVote;
        existing.onSignInRequired = onSignInRequired;
      } else {
        pendingVotes.current.set(key, {
          target,
          targetID,
          desiredVote,
          confirmed: current,
          inFlight: false,
          onSignInRequired,
        });
      }

      applyVoteState(target, targetID, next);
      void flushVote(key);
    },
  }), [applyVoteState, flushVote, optimisticVotes]);

  return <VoteContext.Provider value={contextValue}>{children}</VoteContext.Provider>;
};

export const useVotePost = (target: VoteTarget, targetID: string, fallback: VoteState) => {
  const context = useContext(VoteContext);
  if (!context) throw new Error('useVotePost must be used within VoteProvider');

  return {
    voteState: context.getVoteState(target, targetID, fallback),
    vote: (value: VoteActionValue, onSignInRequired: () => void) =>
      context.vote({ target, targetID, value, current: context.getVoteState(target, targetID, fallback), onSignInRequired }),
  };
};
