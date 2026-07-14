'use client';

import { BellOff, Bookmark, EyeOff, UserCheck, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useContentAction } from '@/hooks/useQueries';
import { useSession } from '@/hooks/useSession';
import type { ContentActionKind, ContentActionTarget } from '@/lib/types';

const labels = {
  saved: ['Save', 'Saved'],
  hidden: ['Hide', 'Hidden'],
  followed: ['Follow', 'Following'],
  muted: ['Mute', 'Muted'],
} as const;

export const ContentActionButton = ({
  kind,
  targetType,
  targetID,
  className,
}: {
  kind: ContentActionKind;
  targetType: ContentActionTarget;
  targetID: string;
  className?: string;
}) => {
  const router = useRouter();
  const user = useSession().user;
  const { query, mutation } = useContentAction(kind, targetType, targetID);
  const active = query.data?.data?.active ?? false;
  const Icon = kind === 'saved'
    ? Bookmark
    : kind === 'hidden'
      ? EyeOff
      : kind === 'muted'
        ? BellOff
        : active ? UserCheck : UserPlus;

  return (
    <button
      type='button'
      className={className}
      disabled={mutation.isPending}
      aria-pressed={active}
      onClick={() => {
        if (!user) {
          toast('Sign in to save preferences', {
            action: { label: 'Sign in', onClick: () => window.location.assign('/auth/sign-in') },
          });
          return;
        }
        const enabled = !active;
        mutation.mutate(enabled, {
          onSuccess: response => {
            if (!response.success) return;
            toast.success(labels[kind][enabled ? 1 : 0]);
            if (kind === 'hidden' && enabled) {
              router.push('/');
              router.refresh();
            }
          },
        });
      }}
    >
      <Icon className='size-3.5' />
      {labels[kind][active ? 1 : 0]}
    </button>
  );
};
