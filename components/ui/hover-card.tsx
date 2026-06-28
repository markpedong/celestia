'use client';

import type { FC } from 'react';
import * as React from 'react';
import { HoverCard as HoverCardPrimitive } from 'radix-ui';
import classNames from 'classnames';
import styles from './hover-card.module.scss';

export const HoverCard: FC<React.ComponentProps<typeof HoverCardPrimitive.Root>> = props => (
  <HoverCardPrimitive.Root openDelay={200} closeDelay={120} {...props} />
);

export const HoverCardTrigger: FC<React.ComponentProps<typeof HoverCardPrimitive.Trigger>> = props => (
  <HoverCardPrimitive.Trigger {...props} />
);

export const HoverCardContent: FC<React.ComponentProps<typeof HoverCardPrimitive.Content>> = ({
  className,
  sideOffset = 8,
  align = 'start',
  ...props
}) => (
  <HoverCardPrimitive.Portal>
    <HoverCardPrimitive.Content
      sideOffset={sideOffset}
      align={align}
      className={classNames(styles.content, className)}
      {...props}
    />
  </HoverCardPrimitive.Portal>
);
