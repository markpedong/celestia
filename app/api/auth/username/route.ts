import {prisma} from '@/lib/prisma'
import {generateErrorResponse, generateSuccessResponse} from '@/services/request'
import {checkRateLimit} from '@/lib/server/rate-limit'
import {lookupUsernameAddress, trustedClientIP} from '@/lib/username-signin'

export const POST = async (request: Request) => {
  let body: {userName?: unknown}
  try {
    body = await request.json()
  } catch {
    return generateErrorResponse('Invalid credentials.', 400)
  }

  try {
    const result = await lookupUsernameAddress(body?.userName, trustedClientIP(request.headers, process.env.TRUSTED_CLIENT_IP_HEADER), {
      limit: (key, attempts, windowSeconds) => checkRateLimit(key, attempts, windowSeconds, {failOpen: false}),
      lookup: userName => prisma.users.findUnique({where: {userName}, select: {email: true}})
    })
    if (result.status === 'throttled') {
      return generateErrorResponse('Too many sign-in attempts. Please try again later.', 429)
    }
    if (result.status !== 'found') return generateErrorResponse('Invalid credentials.', 404)

    // Username-to-email lookup is retained for the current browser sign-in flow.
    // It remains an enumeration surface; never claim per-user/global throttling
    // alone eliminates this privacy risk. Replace with server-side credential
    // verification before considering this endpoint production-hardened.
    return generateSuccessResponse({email: result.email})
  } catch {
    return generateErrorResponse('Sign-in is temporarily unavailable. Try again later.', 503)
  }
}
