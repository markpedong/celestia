export const siteName = 'Celestia';

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const siteDescription =
  'Celestia is a cosmic community forum for discovering signals, sharing posts, voting on ideas, and joining threaded conversations across technology, space, science, gaming, and more.';

export const defaultOgImage = '/images/celestia-reference.png';

export const truncateDescription = (value: string, maxLength = 155) => {
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length > maxLength ? `${clean.slice(0, maxLength - 3).trim()}...` : clean;
};
