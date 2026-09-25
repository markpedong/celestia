/** A shared, testable visibility rule for author actions. */
export const authorActionState = (sessionUserID: string | null | undefined, authorID: string) => {
  if (sessionUserID === undefined) return 'loading' as const;
  if (sessionUserID === null) return 'guest' as const;
  return sessionUserID === authorID ? 'self' as const : 'ready' as const;
};
