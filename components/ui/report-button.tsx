'use client';

import { Flag } from 'lucide-react';
import { toast } from 'sonner';
import { useSubmitReport } from '@/hooks/useQueries';
import { useSession } from '@/hooks/useSession';

export const ReportButton = ({
  targetType,
  targetID,
  className,
}: {
  targetType: 'post' | 'comment' | 'user';
  targetID: string;
  className?: string;
}) => {
  const user = useSession().user;
  const report = useSubmitReport();

  return (
    <button
      type='button'
      className={className}
      disabled={report.isPending}
      onClick={() => {
        if (!user) {
          toast('Sign in to report content', {
            action: { label: 'Sign in', onClick: () => window.location.assign('/auth/sign-in') },
          });
          return;
        }
        const reason = window.prompt('What is wrong with this content?');
        if (reason?.trim()) report.mutate({ targetType, targetID, reason: reason.trim() });
      }}
    >
      <Flag className='size-3.5' /> Report
    </button>
  );
};
