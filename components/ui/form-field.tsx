'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import classNames from 'classnames';
import { Input } from './input';
import { Label } from './label';
import type { FormFieldProps } from '@/lib/types';
import { Textarea } from './textarea';
import styles from './form-field.module.scss';

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
      <div className={classNames(styles.wrapper, wrapperClassName)}>
        <Label htmlFor={inputID} className={labelClassName}>
          {label}
        </Label>

        <div className={classNames({
          [styles.passwordShell]: isPassword && !children,
        })}>
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
                className={classNames(className, {
                  [styles.passwordInput]: isPassword,
                })}
              />
            ))}

          {isPassword && !children ? (
            <button
              type='button'
              onClick={() => setIsVisible(visible => !visible)}
              className={styles.visibilityButton}
              aria-label={isVisible ? 'Hide password' : 'Show password'}
            >
              {isVisible ? <Eye className={styles.icon} /> : <EyeOff className={styles.icon} />}
            </button>
          ) : null}
        </div>

        {hint ? <p className={styles.hint}>{hint}</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export default FormField;
