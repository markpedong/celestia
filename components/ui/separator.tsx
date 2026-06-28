"use client"

import type { FC } from 'react';
import * as React from "react"
import { Separator as SeparatorPrimitive } from "radix-ui"

import classNames from 'classnames';
import styles from './separator.module.scss';

const Separator: FC<React.ComponentProps<typeof SeparatorPrimitive.Root>> = ({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) => {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={classNames(styles.separator, className)}
      {...props}
    />
  )
};

export { Separator }
