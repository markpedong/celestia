'use client';
import { createPostAction } from '@/lib/actions/posts';
import { useActionState } from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';

export function SubmitPostForm() {
  const [state, action, pending] = useActionState(createPostAction, null);

  return (
    <form action={action} className='celestia-card space-y-6 p-6'>
      <div className='space-y-2'>
        <Label htmlFor='title'>Title</Label>
        <Input
          id='title'
          name='title'
          required
          minLength={4}
          maxLength={300}
          placeholder="What's your signal?"
          className='h-11 border-border bg-secondary/80 px-4 text-[15px] focus-visible:border-primary/40 focus-visible:ring-primary/20'
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='body'>Body</Label>
        <Textarea
          id='body'
          name='body'
          rows={8}
          placeholder='Add context, observations, links...'
          className='resize-y border-border bg-secondary/80 px-4 py-3 leading-7 focus-visible:border-primary/40 focus-visible:ring-primary/20'
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='tags'>Topics</Label>
        <Input
          id='tags'
          name='tags'
          placeholder='astrophysics, observing, space-tech'
          className='h-11 border-border bg-secondary/80 px-4 focus-visible:border-primary/40 focus-visible:ring-primary/20'
        />
        <p className='text-xs text-muted-foreground'>Comma-separated. Defaults to #webdev if empty.</p>
      </div>

      {state?.error ? (
        <p className='text-sm text-destructive' role='alert'>
          {state.error}
        </p>
      ) : null}

      <Button type='submit' disabled={pending} className='celestia-primary-action h-10 w-full'>
        {pending ? 'Transmitting...' : 'Transmit Signal'}
      </Button>
    </form>
  );
}
