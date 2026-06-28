import type { FC } from 'react';
import * as React from "react"

import classNames from 'classnames';
import styles from './textarea.module.scss';

const Textarea: FC<React.ComponentProps<"textarea">> = ({ className, ...props }: React.ComponentProps<"textarea">) => {
  return (
    <textarea
      data-slot="textarea"
      className={classNames(styles.textarea, className)}
      {...props}
    />
  )
};

export { Textarea }
