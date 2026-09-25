import {createHash} from 'node:crypto'
import {isIP} from 'node:net'

export type UsernameSession = {accessToken: string; refreshToken: string}
export type UsernameSignInDependencies = {
  limit: (key: string, attempts: number, windowSeconds: number) => Promise<boolean>
  lookup: (userName: string) => Promise<{id: string; email: string} | null>
  verify: (email: string, password: string) => Promise<{userID: string; session: UsernameSession} | null>
  deletionPending: (userID: string) => Promise<boolean>
}

const digest = (value: string) => createHash('sha256').update(value).digest('hex').slice(0, 32)

/** Trust the nominated header only if the deployment's ingress overwrites it.
 * Never accept an attacker-controlled forwarding chain as an IP identity.
 */
export const trustedClientIP = (headers: Headers, configuredHeader?: string) => {
  const name = configuredHeader?.toLowerCase()
  if (name !== 'cf-connecting-ip' && name !== 'x-real-ip' && name !== 'x-vercel-forwarded-for') return null
  const raw = headers.get(name)?.trim() ?? ''
  return isIP(raw) ? raw : null
}

export const authenticateUsername = async (
  userNameInput: unknown,
  passwordInput: unknown,
  ip: string | null,
  deps: UsernameSignInDependencies
): Promise<{status: 'authenticated'; session: UsernameSession} | {status: 'invalid' | 'throttled'}> => {
  // Bound the input before deriving rate-limit keys or querying the database.
  const userName = typeof userNameInput === 'string' && userNameInput.length <= 256
    ? userNameInput.trim().toLowerCase()
    : ''
  const password = typeof passwordInput === 'string' ? passwordInput : ''

  // These fail closed without Redis. Header spoofing cannot evade either limit.
  if (!await deps.limit('username-login:global', 300, 60)) return {status: 'throttled'}
  if (!await deps.limit(`username-login:name:${digest(userName)}`, 8, 600)) return {status: 'throttled'}
  if (ip && !await deps.limit(`username-login:ip:${digest(ip)}`, 30, 60)) return {status: 'throttled'}

  if (!/^[a-z0-9_]{3,28}$/.test(userName) || password.length < 1 || password.length > 72) {
    return {status: 'invalid'}
  }

  const profile = await deps.lookup(userName)
  if (!profile) return {status: 'invalid'}
  const verified = await deps.verify(profile.email, password)
  if (!verified || verified.userID !== profile.id || await deps.deletionPending(profile.id)) {
    return {status: 'invalid'}
  }

  // The account email never leaves the server. Session tokens only go to the
  // client after successful credential verification, as with normal Supabase login.
  return {status: 'authenticated', session: verified.session}
}
