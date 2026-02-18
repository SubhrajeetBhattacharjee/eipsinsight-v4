import { os, ORPCError, type Ctx } from './types'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadImageToCloudinary } from '@/lib/cloudinary'
import * as z from 'zod'

async function requireAdmin(context: Ctx) {
  const session = await auth.api.getSession({ headers: context.headers })
  if (!session?.user) {
    throw new ORPCError('UNAUTHORIZED', { message: 'You must be logged in' })
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (!user || user.role !== 'admin') {
    throw new ORPCError('FORBIDDEN', { message: 'Admin access required' })
  }
  return session
}

const blogSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  title: z.string().min(1),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  coverImage: z.string().url().optional().nullable(),
  published: z.boolean().optional(),
})

export const blogProcedures = {
  list: os
    .$context<Ctx>()
    .input(
      z.object({
        publishedOnly: z.boolean().optional().default(true),
        limit: z.number().min(1).max(100).optional().default(20),
        offset: z.number().min(0).optional().default(0),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!input.publishedOnly) {
        await requireAdmin(context)
      }
      const posts = await prisma.blog.findMany({
        where: input.publishedOnly ? { published: true } : undefined,
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
      })
      const total = await prisma.blog.count({
        where: input.publishedOnly ? { published: true } : undefined,
      })
      return { posts, total }
    }),

  getById: os
    .$context<Ctx>()
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      await requireAdmin(context)
      const post = await prisma.blog.findUnique({
        where: { id: input.id },
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
      })
      if (!post) {
        throw new ORPCError('NOT_FOUND', { message: 'Blog post not found' })
      }
      return post
    }),

  getBySlug: os
    .$context<Ctx>()
    .input(z.object({ slug: z.string() }))
    .handler(async ({ input, context }) => {
      const post = await prisma.blog.findUnique({
        where: { slug: input.slug },
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
      })
      if (!post) {
        throw new ORPCError('NOT_FOUND', { message: 'Blog post not found' })
      }
      if (!post.published) {
        try {
          await requireAdmin(context)
        } catch {
          throw new ORPCError('NOT_FOUND', { message: 'Blog post not found' })
        }
      }
      return post
    }),

  create: os
    .$context<Ctx>()
    .input(blogSchema)
    .handler(async ({ input, context }) => {
      const session = await requireAdmin(context)
      const existing = await prisma.blog.findUnique({ where: { slug: input.slug } })
      if (existing) {
        throw new ORPCError('BAD_REQUEST', { message: 'A blog post with this slug already exists' })
      }
      const post = await prisma.blog.create({
        data: {
          ...input,
          authorId: session.user.id,
          published: input.published ?? false,
        },
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
      })
      return post
    }),

  update: os
    .$context<Ctx>()
    .input(
      z.object({
        id: z.string(),
        slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
        title: z.string().min(1).optional(),
        excerpt: z.string().optional().nullable(),
        content: z.string().min(1).optional(),
        coverImage: z.string().url().optional().nullable(),
        published: z.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      await requireAdmin(context)
      const { id, ...data } = input
      const post = await prisma.blog.update({
        where: { id },
        data: data as Record<string, unknown>,
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
      })
      return post
    }),

  delete: os
    .$context<Ctx>()
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      await requireAdmin(context)
      await prisma.blog.delete({ where: { id: input.id } })
      return { ok: true }
    }),

  uploadCoverImage: os
    .$context<Ctx>()
    .input(z.object({ fileName: z.string(), base64Data: z.string() }))
    .handler(async ({ input, context }) => {
      await requireAdmin(context)
      const buffer = Buffer.from(input.base64Data, 'base64')
      const blob = new Blob([buffer], { type: 'image/jpeg' })
      const { url } = await uploadImageToCloudinary(blob, input.fileName)
      return { url }
    }),
}
