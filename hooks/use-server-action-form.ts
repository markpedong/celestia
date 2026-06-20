'use client';

import type { FormEventHandler } from 'react';
import { useState, useTransition } from 'react';
import type { DefaultValues, FieldValues } from 'react-hook-form';
import type { z } from 'zod';
import { useZodForm } from './use-zod-form';

type ServerFormAction<TState> = (previousState: TState, formData: FormData) => TState | Promise<TState>;

export const useServerActionForm = <TValues extends FieldValues, TState>(
  action: ServerFormAction<TState>,
  initialState: TState,
  schema: z.ZodType<TValues>,
  defaultValues: DefaultValues<TValues>,
) => {
  const form = useZodForm(schema, defaultValues);
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();

  const onSubmit: FormEventHandler<HTMLFormElement> = event => {
    const formData = new FormData(event.currentTarget);
    void form.handleSubmit(() => {
      startTransition(async () => setState(await action(state, formData)));
    })(event);
  };

  return { form, onSubmit, pending, state };
};
