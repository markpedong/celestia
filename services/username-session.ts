'use client'

import type {SupabaseClient} from '@supabase/supabase-js'
import {API_ENDPOINT} from '@/constants/enums'

type LoginResponse = {
  success?: boolean
  data?: {accessToken?: string; refreshToken?: string}
}

// Username credentials are verified by the server. Unlike the previous
// username lookup this request never returns another person's email.
export const signInWithUserName = async (client: SupabaseClient, userName: string, password: string) => {
  let response: Response
  try {
    response = await fetch(`/api${API_ENDPOINT.USERNAME_LOGIN}`, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({userName, password})
    })
  } catch {
    throw new Error('Sign-in is temporarily unavailable. Please try again later.')
  }

  if (!response.ok) {
    throw new Error(response.status === 429
      ? 'Too many sign-in attempts. Try again later.'
      : response.status === 503
        ? 'Sign-in is temporarily unavailable. Please try again later.'
        : 'That email, username, or password is incorrect.')
  }

  let payload: LoginResponse
  try {
    payload = await response.json() as LoginResponse
  } catch {
    throw new Error('Sign-in could not establish a session. Please retry.')
  }
  if (!payload.success || !payload.data?.accessToken || !payload.data.refreshToken) {
    throw new Error('Sign-in could not establish a session. Please retry.')
  }

  // Supabase persists the returned credentials in the browser client's normal
  // SSR cookie storage so MFA and session listeners continue to work.
  return client.auth.setSession({
    access_token: payload.data.accessToken,
    refresh_token: payload.data.refreshToken
  })
}
