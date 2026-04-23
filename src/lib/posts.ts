import { getCollection } from 'astro:content'
import type { CollectionEntry } from 'astro:content'

import type { PostSummary } from '../types/blog'

const byDateDesc = (a: { createdAt: Date }, b: { createdAt: Date }) =>
  b.createdAt.getTime() - a.createdAt.getTime()

const getPostSlug = (id: string) => id.replace(/\.(md|mdx)$/i, '').toLowerCase()

export const mapPostSummary = (
  entry: CollectionEntry<'blog'>,
): PostSummary => {
  const slug = getPostSlug(entry.id)

  return {
    slug,
    title: entry.data.title,
    description: entry.data.description,
    createdAt: entry.data.createAt,
    tags: entry.data.tags,
    url: `/posts/${slug}/`,
  }
}

export const getAllPosts = async () => {
  const entries = await getCollection('blog')

  return entries.map(mapPostSummary).sort(byDateDesc)
}

export const getLatestPosts = async (limit = 5) => {
  const posts = await getAllPosts()
  return posts.slice(0, limit)
}
