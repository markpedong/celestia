'use client';

import { updateCommunityAction } from '@/lib/actions/communities';
import type { Community } from '@/lib/types';
import { useActionState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Save } from 'lucide-react';

export function CommunitySettingsForm({ community }: { community: Community }) {
  const [state, action, pending] = useActionState(updateCommunityAction, null);

  return (
    <form action={action} className='celestia-card space-y-5 p-5 md:p-6'>
      <input type='hidden' name='slug' value={community.slug} />
      <div className='rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground'>
        Community URL: <span className='font-semibold text-foreground'>r/{community.slug}</span>. URLs stay fixed after creation.
      </div>
      <div className='space-y-2'>
        <Label htmlFor='label'>Community name</Label>
        <Input id='label' name='label' required minLength={3} maxLength={60} defaultValue={community.label} className='h-11 bg-secondary/80' />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='description'>Description</Label>
        <Textarea id='description' name='description' rows={5} maxLength={500} defaultValue={community.description} className='resize-y bg-secondary/80 leading-6' />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='hashColor'>Community color</Label>
        <div className='flex items-center gap-3'>
          <Input id='hashColor' name='hashColor' required pattern='#[0-9A-Fa-f]{6}' defaultValue={community.hashColor} className='h-11 max-w-40 bg-secondary/80 font-mono' />
          <span className='size-8 rounded-full border border-border' style={{ backgroundColor: community.hashColor }} aria-hidden />
        </div>
      </div>
      {state?.error ? <p className='rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive' role='alert'>{state.error}</p> : null}
      <Button type='submit' disabled={pending} className='celestia-primary-action h-11 w-full rounded-xl'>
        <Save className='size-4' /> {pending ? 'Saving…' : 'Save community settings'}
      </Button>
    </form>
  );
}
