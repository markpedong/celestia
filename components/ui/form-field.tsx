'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Label } from './label';
import type { FormFieldProps } from '@/lib/types';
import { Textarea } from './textarea';

const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement, FormFieldProps>(
  (
    {
      as = 'input',
      wrapperClassName,
      error,
      hint,
      label,
      labelClassName,
      id,
      name,
      htmlFor,
      className,
      children,
      ...fieldProps
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);

    const inputID = htmlFor ?? id ?? name;
    const isTextarea = as === 'textarea';
    const inputType = !isTextarea && 'type' in fieldProps ? fieldProps.type : undefined;
    const isPassword = inputType === 'password';

    return (
      <div className={cn('space-y-2', wrapperClassName)}>
        <Label htmlFor={inputID} className={labelClassName}>
          {label}
        </Label>

        <div className={cn(isPassword && !children && 'relative')}>
          {children ??
            (isTextarea ? (
              <Textarea
                ref={ref as React.Ref<HTMLTextAreaElement>}
                id={inputID}
                name={name}
                aria-invalid={fieldProps['aria-invalid'] ?? Boolean(error)}
                className={className}
                {...(fieldProps as React.ComponentProps<'textarea'>)}
              />
            ) : (
              <Input
                ref={ref as React.Ref<HTMLInputElement>}
                id={inputID}
                name={name}
                aria-invalid={fieldProps['aria-invalid'] ?? Boolean(error)}
                autoComplete='off'
                {...(fieldProps as React.ComponentProps<'input'>)}
                type={isPassword && isVisible ? 'text' : inputType}
                className={cn(className, isPassword && 'pr-10')}
              />
            ))}

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
