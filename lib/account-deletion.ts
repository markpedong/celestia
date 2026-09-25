/**
 * Retryable account deletion. The database holds an independent deletion record
 * before the first external call. No application rows are removed until Auth
 * deletion is confirmed. Each stage can be replayed after a crash.
 */
export type DeletionStatus = 'pending_auth' | 'pending_cleanup' | 'pending_storage';

export type DeletionRecord = {
  userID: string;
  status: DeletionStatus;
};

/** HTTP 404 alone can mean a broken Auth endpoint or invalid project URL.
 * Only Supabase's explicit user-not-found code establishes safe absence.
 */
export const isConfirmedMissingAuthUser = (error: {status?: number; code?: string} | null) =>
  error?.status === 404 && error.code === 'user_not_found';

export type DeletionLease = {
  acquire: (userID: string) => Promise<boolean>;
  release: (userID: string) => Promise<void>;
};

/** Prevent concurrent browser/cron workers from running the same external deletion. */
export const runLeasedDeletion = async (
  userID: string,
  lease: DeletionLease,
  run: () => Promise<'complete'>,
): Promise<'complete' | 'busy'> => {
  if (!await lease.acquire(userID)) return 'busy';
  try {
    return await run();
  } finally {
    await lease.release(userID);
  }
};

export type DeletionOperations = {
  load: (userID: string) => Promise<DeletionRecord | null>;
  authUserExists: (userID: string) => Promise<boolean>;
  deleteAuthUser: (userID: string) => Promise<void>;
  markAuthDeleted: (userID: string) => Promise<void>;
  cleanupApplicationData: (userID: string) => Promise<void>;
  cleanupStorage: (userID: string) => Promise<void>;
  finish: (userID: string) => Promise<void>;
};

/** Run a previously recorded request; a missing record is a harmless replay. */
export const reconcileAccountDeletion = async (userID: string, operations: DeletionOperations) => {
  const record = await operations.load(userID);
  if (!record) return 'complete' as const;

  if (record.status === 'pending_auth') {
    // Also handles a crash after successful Auth deletion but before the status write.
    if (await operations.authUserExists(userID)) {
      try {
        await operations.deleteAuthUser(userID);
      } catch (error) {
        // An ambiguous 404 or timeout must never be mistaken for confirmed deletion.
        if (await operations.authUserExists(userID)) throw error;
      }
    }
    await operations.markAuthDeleted(userID);
  }

  if (record.status === 'pending_auth' || record.status === 'pending_cleanup') {
    // This method must commit the data cleanup AND pending_storage status atomically.
    await operations.cleanupApplicationData(userID);
  }

  await operations.cleanupStorage(userID);
  await operations.finish(userID);
  return 'complete' as const;
};
