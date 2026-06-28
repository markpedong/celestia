"use client"

import type { FC } from 'react';
import * as React from "react";
import { Avatar as AvatarPrimitive } from "radix-ui";

import classNames from 'classnames';
import styles from './avatar.module.scss';

const Avatar: FC<React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: "default" | "sm" | "lg"
}> = ({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: "default" | "sm" | "lg"
}) => {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={classNames('group/avatar', styles.root, className)}
      {...props}
    />
  )
};

const AvatarImage: FC<React.ComponentProps<typeof AvatarPrimitive.Image>> = ({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) => {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={classNames(styles.image, className)}
      {...props}
    />
  )
};

const AvatarFallback: FC<React.ComponentProps<typeof AvatarPrimitive.Fallback>> = ({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) => {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={classNames(styles.fallback, className)}
      {...props}
    />
  )
};

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
}
