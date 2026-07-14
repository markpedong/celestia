'use client';

import { useMutation } from '@tanstack/react-query';
import { Check, ExternalLink, Flag, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import type { ModerationReport } from '@/lib/types';
import { formatTimeAgo } from '@/lib/utils';
import { reviewReport } from '@/services';

export const CommunityReportsPanel = ({ reports }: { reports: ModerationReport[] }) => {
  const router = useRouter();
  const review = useMutation({
    mutationFn: ({ reportID, status }: { reportID: string; status: 'approved' | 'dismissed' }) =>
      reviewReport(reportID, status),
    onSuccess: response => {
      if (!response.success) {
        toast.error(response.message || 'Unable to review report.');
        return;
      }
      toast.success('Report reviewed.');
      router.refresh();
    },
    onError: error => toast.error(error instanceof Error ? error.message : 'Unable to review report.'),
  });
  const pending = reports.filter(report => report.status === 'pending');

  if (!pending.length) {
    return <EmptyState icon={Flag} title='Report queue clear' description='New post and comment reports will appear here.' />;
  }

  return (
    <section className='space-y-3'>
      <div>
        <p className='celestia-panel-label'>Moderation</p>
        <h2 className='mt-2 text-xl font-bold tracking-tight'>Pending reports</h2>
      </div>
      {pending.map(report => (
        <article key={report.id} className='rounded border border-border bg-muted/25 p-4'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div className='min-w-0'>
              <p className='text-sm font-semibold capitalize'>{report.targetType} report</p>
              <p className='mt-1 text-sm leading-6 text-muted-foreground'>{report.reason}</p>
              <p className='mt-2 font-mono text-[11px] text-muted-foreground'>Submitted {formatTimeAgo(report.createdAt)}</p>
            </div>
            {report.targetType === 'post' ? (
              <Button asChild size='sm' variant='outline'>
                <Link href={`/post/${report.targetID}`}><ExternalLink /> Open post</Link>
              </Button>
            ) : null}
          </div>
          <div className='mt-4 flex flex-wrap justify-end gap-2'>
            <Button
              size='sm'
              variant='outline'
              disabled={review.isPending}
              onClick={() => review.mutate({ reportID: report.id, status: 'dismissed' })}
            >
              <X /> Dismiss
            </Button>
            <Button
              size='sm'
              disabled={review.isPending}
              onClick={() => review.mutate({ reportID: report.id, status: 'approved' })}
            >
              <Check /> Confirm report
            </Button>
          </div>
        </article>
      ))}
    </section>
  );
};
