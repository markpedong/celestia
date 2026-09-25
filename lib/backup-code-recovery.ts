/** Recovery for the legacy, locally hashed one-time backup codes.
 * A verified code authorizes a *factor reset*, never an AAL2 session upgrade.
 * Supabase revokes sessions when a verified factor is administratively removed.
 */
export type BackupRecoveryOperations = {
  claimCode: () => Promise<boolean>
  restoreCode: () => Promise<void>
  removeVerifiedFactor: (factorID: string) => Promise<void>
  invalidateRemainingCodes: () => Promise<void>
}

export const resetFactorsWithBackupCode = async (
  verifiedFactorIDs: string[],
  operations: BackupRecoveryOperations
): Promise<'invalid' | 'recovered' | 'recovered_with_stale_codes'> => {
  if (verifiedFactorIDs.length === 0) throw new Error('No verified factor is enrolled.')
  if (!await operations.claimCode()) return 'invalid'

  try {
    for (const factorID of verifiedFactorIDs) {
      await operations.removeVerifiedFactor(factorID)
    }
  } catch (error) {
    // An external provider may have removed some factors already. Keep this
    // one-time code available for a retry after the user signs in again.
    await operations.restoreCode()
    throw error
  }

  // Factor deletion is irreversible. A DB outage here must not turn a
  // successful reset into an apparent failure that invites another attempt.
  try {
    await operations.invalidateRemainingCodes()
  } catch {
    return 'recovered_with_stale_codes'
  }
  return 'recovered'
}
