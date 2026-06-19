import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Telescope } from 'lucide-react';

const JoinCtaCard = () => {
  return (
    <Card className='celestia-card'>
      <CardHeader className='pb-2'>
        <div className='celestia-brand-mark mb-2 size-11 rounded-xl'>
          <Telescope className='size-5' aria-hidden />
        </div>
        <CardTitle className='text-base'>Join the community</CardTitle>
        <CardDescription className='text-muted-foreground'>
          Create posts, vote, and follow topics you care about.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href='/auth/sign-up'
          className={cn(
            buttonVariants({ variant: 'default' }),
            'celestia-primary-action w-full justify-center'
          )}
        >
          Join Celestia
        </Link>
      </CardContent>
    </Card>
  );
};

export default JoinCtaCard;
