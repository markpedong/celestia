'use client';

import type { VariantProps } from 'class-variance-authority';
import { Button, buttonVariants } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';

type DialogActionsProps = {
  submitLabel: string;
  submitDisabled?: boolean;
  submitLoading?: boolean;
  submitVariant?: VariantProps<typeof buttonVariants>['variant'];

  cancelLabel?: string;
  hideCancel?: boolean;
};

const DialogActions = ({
  submitLabel,
  submitDisabled,
  submitLoading,
  submitVariant,
  cancelLabel = 'Cancel',
  hideCancel = false,
}: DialogActionsProps) => (
  <DialogFooter>
    {!hideCancel && (
      <DialogClose asChild>
        <Button type='button' variant='outline'>
          {cancelLabel}
        </Button>
      </DialogClose>
    )}

    <Button type='submit' variant={submitVariant} disabled={submitDisabled} isLoading={submitLoading}>
      {submitLabel}
    </Button>
  </DialogFooter>
);

export default DialogActions;
