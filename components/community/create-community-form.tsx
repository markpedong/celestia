'use client';

import { createCommunityAction } from '@/lib/actions/communities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useActionState } from 'react';
import { Plus } from 'lucide-react';

export function CreateCommunityForm() {
  const [state, action, pending] = useActionState(createCommunityAction, null);

  return (
    <form action={action} className='celestia-card space-y-5 p-5 md:p-6'>
      <div className='space-y-2'>
        <Label htmlFor='label'>Community name</Label>
        <Input id='label' name='label' minLength={3} maxLength={60} required placeholder='e.g. Indie Makers' className='h-11 bg-secondary/80' />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='slug'>Community URL</Label>
        <div className='flex items-center rounded border border-border bg-secondary/80 px-3 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20'>
          <span className='shrink-0 text-sm text-muted-foreground'>r/</span>
          <Input id='slug' name='slug' minLength={3} maxLength={32} required placeholder='indie_makers' className='h-11 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0' />
        </div>
        <p className='text-xs text-muted-foreground'>Use letters, numbers, spaces, hyphens, or underscores. The URL is permanent.</p>
      </div>
      <div className='space-y-2'>
        <Label htmlFor='description'>Description <span className='text-muted-foreground'>(optional)</span></Label>
        <Textarea id='description' name='description' maxLength={500} rows={4} placeholder='What conversations belong here?' className='resize-y bg-secondary/80' />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='hashColor'>Community color</Label>
        <input id='hashColor' name='hashColor' type='color' defaultValue='#8b5cf6' className='h-11 w-full cursor-pointer rounded border border-border bg-secondary/80 p-1' aria-label='Community color' />
      </div>
      {state?.error ? <p className='rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive' role='alert'>{state.error}</p> : null}
      <Button type='submit' disabled={pending} className='celestia-primary-action h-11 w-full rounded'>
        <Plus className='size-4' />
        {pending ? 'Creating community…' : 'Create community'}
      </Button>
    </form>
  );
}
