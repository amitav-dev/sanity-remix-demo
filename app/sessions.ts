import { createCookieSessionStorage } from '@remix-run/node'

export const PREVIEW_SESSION_NAME = '__preview'

console.log(process.env.VITE_SANITY_SESSION_SECRET)
if (!process.env.VITE_SANITY_SESSION_SECRET) {
  throw new Error(`Missing VITE_SANITY_SESSION_SECRET in .env`)
}

const { getSession, commitSession, destroySession } = createCookieSessionStorage({
  cookie: {
    name: PREVIEW_SESSION_NAME,
    secrets: [process.env.VITE_SANITY_SESSION_SECRET],
    sameSite: 'lax',
  },
})

export { commitSession, destroySession, getSession }
