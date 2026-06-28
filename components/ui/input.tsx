import * as React from 'react';

import classNames from 'classnames';
import styles from './input.module.scss';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      data-slot='input'
      className={classNames(styles.input, className)}
      {...props}
    />
  ),
);

Input.displayName = 'Input';

export { Input }
