'use client';
import { createPostAction } from '@/lib/actions/posts';
import { useActionState } from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Image as ImageIcon, Link2, Send } from 'lucide-react';

export function SubmitPostForm() {
  const [state, action, pending] = useActionState(createPostAction, null);

  return (
    <form action={action} className='celestia-card space-y-4 p-4 md:p-5'>
      <div className='space-y-2'>
        <Label htmlFor='title' className='text-sm text-slate-200'>Post title</Label>
        <Input
          id='title'
          name='title'
          required
          minLength={4}
          maxLength={300}
          placeholder='What do you want to discuss?'
          className='h-10 rounded-xl border-border bg-secondary/80 px-4 text-[15px] focus-visible:border-primary/40 focus-visible:ring-primary/20'
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='body' className='text-sm text-slate-200'>Body</Label>
        <Textarea
          id='body'
          name='body'
          rows={5}
          placeholder='Add context, details, links...'
          className='resize-y rounded-xl border-border bg-secondary/80 px-4 py-3 leading-6 focus-visible:border-primary/40 focus-visible:ring-primary/20'
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='tags' className='text-sm text-slate-200'>Topics</Label>
        <Input
          id='tags'
          name='tags'
          placeholder='news, questions, webdev'
          className='h-10 rounded-xl border-border bg-secondary/80 px-4 focus-visible:border-primary/40 focus-visible:ring-primary/20'
        />
        <p className='text-xs text-muted-foreground'>Comma-separated. Defaults to #webdev if empty.</p>
      </div>

      <div className='grid gap-3 sm:grid-cols-2'>
        <button type='button' className='flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground'>
          <ImageIcon className='size-4 text-primary' />
          Add image
        </button>
        <button type='button' className='flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground'>
          <Link2 className='size-4 text-cyan-300' />
          Attach link
        </button>
      </div>

      {state?.error ? (
        <p className='text-sm text-destructive' role='alert'>
          {state.error}
        </p>
      ) : null}

      <Button type='submit' disabled={pending} className='celestia-primary-action h-10 w-full rounded-xl'>
        <Send className='size-4' />
        {pending ? 'Posting...' : 'Create Post'}
      </Button>
    </form>
  );
}
