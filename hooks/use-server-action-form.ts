'use client';

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

  const onSubmit = form.handleSubmit((_values, event) => {
    const formElement = event?.currentTarget;
    if (!formElement) return;
    const formData = new FormData(formElement);
    startTransition(async () => setState(await action(state, formData)));
  });

  return { form, onSubmit, pending, state };
};
