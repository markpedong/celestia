'use client';

import type { FC } from 'react';
import * as React from 'react';
import { HoverCard as HoverCardPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

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
      className={cn(
        'z-50 w-80 rounded-2xl border border-border/70 bg-popover p-4 text-popover-foreground shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        className,
      )}
      {...props}
    />
  </HoverCardPrimitive.Portal>
);
