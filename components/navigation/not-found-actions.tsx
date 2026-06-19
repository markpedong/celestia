'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function NotFoundBackButton() {
  return (
    <Button
      type='button'
      variant='outline'
      size='lg'
      className='h-10 rounded-full px-4'
      onClick={() => window.history.back()}
    >
      <ArrowLeft className='size-4' />
      Go back
    </Button>
  );
}
