'use client';

import { FC, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Label } from './label';
import { FormFieldProps, PasswordFieldProps } from '@/lib/types';

export const FormField: FC<FormFieldProps> = ({ children, className, error, hint, htmlFor, label, labelClassName }) => (
  <div className={cn('space-y-2', className)}>
    <Label htmlFor={htmlFor} className={labelClassName}>
      {label}
    </Label>
    {children}
    {hint ? <p className='text-xs text-muted-foreground'>{hint}</p> : null}
    {error ? <p className='text-xs text-destructive'>{error}</p> : null}
  </div>
);

export const PasswordField: FC<PasswordFieldProps> = ({ error, label, labelClassName, ...inputProps }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <FormField htmlFor={inputProps.id} label={label} labelClassName={labelClassName} error={error}>
      <div className='relative'>
        <Input {...inputProps} type={isVisible ? 'text' : 'password'} className={cn(inputProps.className, 'pr-10')} />
        <button
          type='button'
          onClick={() => setIsVisible(visible => !visible)}
          className='absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground'
          aria-label={isVisible ? 'Hide password' : 'Show password'}
        >
          {isVisible ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
        </button>
      </div>
    </FormField>
  );
};
