'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { DefaultValues, FieldValues, Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

export const useZodForm = <TValues extends FieldValues>(schema: z.ZodType<TValues>, defaultValues: DefaultValues<TValues>) =>
  useForm<TValues>({
    resolver: zodResolver(schema as never) as Resolver<TValues>,
    mode: 'onBlur',
    defaultValues,
  });
