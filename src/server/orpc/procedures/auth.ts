import { os, type Ctx } from './types'
import { auth } from '@/lib/auth'

export const authProcedures = {
  getSession: os
    .$context<Ctx>()
    .handler(async ({ context }) => {
      const result = await auth.api.getSession({ headers: context.headers })
      return result ?? null
    }),
}
