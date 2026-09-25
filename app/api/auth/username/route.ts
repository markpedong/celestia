import {createClient} from '@supabase/supabase-js'
import {prisma} from '@/lib/prisma'
import {generateErrorResponse, generateSuccessResponse} from '@/services/request'
import {checkRateLimit} from '@/lib/server/rate-limit'
import {authenticateUsername, trustedClientIP} from '@/lib/username-signin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Password verification happens on the server. A username alone never reveals
// the associated email address; tokens are issued only for a valid password.
export const POST = async (request: Request) => {
  const reply = (message: string, status: number) => {
    const response = generateErrorResponse(message, status)
    response.headers.set('Cache-Control', 'no-store')
    return response
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return reply('Invalid credentials.', 401)
  }

  const values = body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {}
  try {
    const result = await authenticateUsername(
      values.userName,
      values.password,
      trustedClientIP(request.headers, process.env.TRUSTED_CLIENT_IP_HEADER),
      {
        limit: (key, attempts, windowSeconds) => checkRateLimit(key, attempts, windowSeconds, {failOpen: false}),
        lookup: userName => prisma.users.findUnique({where: {userName}, select: {id: true, email: true}}),
        verify: async (email, password) => {
          const client = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
            {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}}
          )
          const {data, error} = await client.auth.signInWithPassword({email, password})
          if (error || !data.user || !data.session) return null
          return {
            userID: data.user.id,
            session: {
              accessToken: data.session.access_token,
              refreshToken: data.session.refresh_token
            }
          }
        },
        deletionPending: async userID => Boolean(await prisma.accountDeletion.findUnique({
          where: {userID},
          select: {userID: true}
        }))
      }
    )

    if (result.status === 'throttled') {
      return reply('Too many sign-in attempts. Try again later.', 429)
    }
    if (result.status !== 'authenticated') return reply('Invalid credentials.', 401)

    const response = generateSuccessResponse({
      accessToken: result.session.accessToken,
      refreshToken: result.session.refreshToken
    })
    response.headers.set('Cache-Control', 'private, no-store')
    response.headers.set('Pragma', 'no-cache')
    return response
  } catch {
    // Missing Redis or upstream Auth/DB failures are indistinguishable to the
    // caller; never expose the underlying email, provider errors or credentials.
    return reply('Sign-in is temporarily unavailable. Please try again later.', 503)
  }
}
