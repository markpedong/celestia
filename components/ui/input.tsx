import type { FC } from 'react';
import * as React from "react";

import classNames from 'classnames';
import styles from './input.module.scss';

const Input: FC<React.ComponentProps<"input">> = ({ className, type, ...props }: React.ComponentProps<"input">) => {
  return (
    <input
      type={type}
      data-slot="input"
      className={classNames(styles.input, className)}
      {...props}
    />
  )
};

export { Input }
