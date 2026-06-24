import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
};

export const formatTimeAgo = (date: Date | string) => dayjs(date).fromNow();