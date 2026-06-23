export const getInitialDisplayName = async (fallback: string) => {
  try {
    const response = await fetch('https://random-word-api.herokuapp.com/word?number=2');
    const words = await response.json();
    if (Array.isArray(words) && words.length === 2 && words.every(word => typeof word === 'string')) {
      return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  } catch { }
  return fallback.trim() || 'New User';
};
