import { os, ORPCError, type Ctx } from './types'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadImageToCloudinary } from '@/lib/cloudinary'
import * as z from 'zod'

export const accountProcedures = {
  getMe: os
    .$context<Ctx>()
    .handler(async ({ context }) => {
      const session = await auth.api.getSession({ headers: context.headers })
      if (!session?.user) {
        throw new ORPCError('UNAUTHORIZED')
      }
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, image: true, role: true },
      })
      if (!user) throw new ORPCError('UNAUTHORIZED')
      return user
    }),
  update: os
    .$context<Ctx>()
    .input(
      z.object({
        name: z.string().min(1).optional(),
        image: z.string().url().optional(),
        avatarUrl: z.string().url().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const session = await auth.api.getSession({ headers: context.headers })
      if (!session?.user) {
        throw new ORPCError('UNAUTHORIZED')
      }
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          name: input.name ?? undefined,
          image: input.image ?? undefined,
        },
      })
      return { ok: true }
    }),
  uploadAvatar: os
    .$context<Ctx>()
    .input(z.object({ fileName: z.string(), base64Data: z.string() }))
    .handler(async ({ input, context }) => {
      const session = await auth.api.getSession({ headers: context.headers })
      if (!session?.user) {
        throw new ORPCError('UNAUTHORIZED')
      }

      // Decode base64 to blob
      const buffer = Buffer.from(input.base64Data, 'base64')
      const blob = new Blob([buffer], { type: 'image/jpeg' })

      const { url } = await uploadImageToCloudinary(blob, input.fileName)

      await prisma.user.update({
        where: { id: session.user.id },
        data: { image: url, avatarUrl: url },
      })

      return { url }
    }),
}
