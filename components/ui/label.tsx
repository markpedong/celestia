"use client"

import type { FC } from 'react';
import * as React from "react"
import { Label as LabelPrimitive } from "radix-ui"

import classNames from 'classnames';
import styles from './label.module.scss';

const Label: FC<React.ComponentProps<typeof LabelPrimitive.Root>> = ({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) => {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={classNames(styles.label, className)}
      {...props}
    />
  )
};

export { Label }
