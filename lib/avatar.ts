
export const getAvatarUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}`;

export const getAvatarFallback = (name?: string | null) => {
  if (!name) return '?';

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
};