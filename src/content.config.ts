import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    issueId: z.number(),
    issueNumber: z.number(),
    state: z.string(),
    createAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    auther: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
  }),
})

const about = defineCollection({
  loader: glob({ base: './src/content', pattern: 'about.md' }),
  schema: z.object({
    title: z.string(),
  }),
})

export const collections = { blog, about }
