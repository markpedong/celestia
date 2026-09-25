import {createHash} from 'node:crypto'
import {isIP} from 'node:net'

export type UsernameLookupDependencies = {
  limit: (key: string, attempts: number, windowSeconds: number) => Promise<boolean>
  lookup: (userName: string) => Promise<{email: string} | null>
}

const digest = (value: string) => createHash('sha256').update(value).digest('hex').slice(0, 32)

/** IP headers are ignored unless deployment ingress is configured to overwrite them. */
export const trustedClientIP = (headers: Headers, configuredHeader?: string) => {
  const name = configuredHeader?.toLowerCase()
  if (name !== 'cf-connecting-ip' && name !== 'x-real-ip' && name !== 'x-vercel-forwarded-for') return null
  const raw = headers.get(name)?.trim() ?? ''
  return isIP(raw) ? raw : null
}

export const lookupUsernameAddress = async (
  userNameInput: unknown,
  ip: string | null,
  deps: UsernameLookupDependencies
): Promise<{status: 'found'; email: string} | {status: 'invalid' | 'throttled'}> => {
  const userName = typeof userNameInput === 'string' ? userNameInput.trim().toLowerCase() : ''
  // Global and per-account limits cannot be bypassed by spoofing forwarding headers.
  if (!await deps.limit('username-login:global', 300, 60)) return {status: 'throttled'}
  if (!await deps.limit(`username-login:name:${digest(userName)}`, 8, 600)) return {status: 'throttled'}
  if (ip && !await deps.limit(`username-login:ip:${digest(ip)}`, 30, 60)) return {status: 'throttled'}
  if (!/^[a-z0-9_]{3,28}$/.test(userName)) return {status: 'invalid'}
  const profile = await deps.lookup(userName)
  return profile?.email ? {status: 'found', email: profile.email} : {status: 'invalid'}
}
