'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { DefaultValues, FieldValues, Resolver } from 'react-hook-form';
import type { KeyboardEventHandler } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

export const useZodForm = <TValues extends FieldValues>(schema: z.ZodType<TValues>, defaultValues: DefaultValues<TValues>) => {
  const form = useForm<TValues>({
    resolver: zodResolver(schema as never) as Resolver<TValues>,
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues,
  });

  const onFormKeyDown: KeyboardEventHandler<HTMLFormElement> = event => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;

    const isTextArea = event.target instanceof HTMLTextAreaElement;
    const isTextInput = event.target instanceof HTMLInputElement || isTextArea;
    if (!isTextInput || (isTextArea && event.shiftKey)) return;

    event.preventDefault();
    const formElement = event.currentTarget;
    void form.handleSubmit(() => formElement.requestSubmit())(event);
  };

  return { ...form, onFormKeyDown };
};
