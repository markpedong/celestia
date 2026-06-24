'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Label } from './label';
import type { FormFieldProps } from '@/lib/types';

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ wrapperClassName, error, hint, label, labelClassName, type, id, name, htmlFor, className, children, ...inputProps }, ref) => {
    const [isVisible, setIsVisible] = useState(false);

    const inputId = htmlFor ?? id ?? name;
    const isPassword = type === 'password';

    return (
      <div className={cn('space-y-2', wrapperClassName)}>
        <Label htmlFor={inputId} className={labelClassName}>
          {label}
        </Label>

        <div className={cn(isPassword && !children && 'relative')}>
          {children ?? (
            <Input
              ref={ref}
              id={inputId}
              name={name}
              type={isPassword && isVisible ? 'text' : type}
              aria-invalid={inputProps['aria-invalid'] ?? Boolean(error)}
              className={cn(className, isPassword && 'pr-10')}
              autoComplete='off'
              {...inputProps}
            />
          )}

          {isPassword && !children ? (
            <button
              type='button'
              onClick={() => setIsVisible(visible => !visible)}
              className='absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground'
              aria-label={isVisible ? 'Hide password' : 'Show password'}
            >
              {isVisible ? <Eye className='size-4' /> : <EyeOff className='size-4' />}
            </button>
          ) : null}
        </div>

        {hint ? <p className='text-xs text-muted-foreground'>{hint}</p> : null}
        {error ? <p className='text-xs text-destructive'>{error}</p> : null}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export default FormField;
