import * as React from 'react';

import classNames from 'classnames';
import styles from './textarea.module.scss';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      data-slot='textarea'
      className={classNames(styles.textarea, className)}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';

export { Textarea }
