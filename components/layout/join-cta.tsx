import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Telescope } from 'lucide-react';

const JoinCtaCard = () => {
  return (
    <section className='celestia-card flex flex-col gap-4 overflow-hidden rounded bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10'>
      <div className='grid auto-rows-min items-start gap-1 rounded-t-xl px-4 pb-2 [.border-b]:pb-4'>
        <div className='celestia-brand-mark mb-2 size-11 rounded'>
          <Telescope className='size-5' aria-hidden />
        </div>
        <div className='font-heading text-base leading-snug font-medium'>Join the community</div>
        <div className='text-sm text-muted-foreground'>
          Create posts, vote, and follow topics you care about.
        </div>
      </div>
      <div className='px-4'>
        <Link
          href='/auth/sign-up'
          className={cn(
            buttonVariants({ variant: 'default', size: 'lg' }),
            'celestia-primary-action w-full justify-center'
          )}
        >
          Join Celestia
        </Link>
      </div>
    </section>
  );
};

export default JoinCtaCard;
