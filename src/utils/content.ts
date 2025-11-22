import { getCollection } from 'astro:content'

export interface FormattedPost {
  id: string
  slug: string
  title: string
  date: string
  year: number
  summary: string
  tags: string[]
  data: any
  collectionEntry: any
}

/**
 * 获取并格式化所有博客文章
 * 适配 Astro 5 Content Layer API
 */
export async function getFormattedPosts(): Promise<FormattedPost[]> {
  // 获取 'blog' 集合的数据
  const posts = await getCollection('blog')

  const formattedPosts = posts.map((post) => {
    const dateObj = new Date(post.data.createdAt)
    // 格式化日期为 YYYY-MM-DD
    const dateString = dateObj.toISOString().split('T')[0]
    const year = dateObj.getFullYear()

    // Astro 5 的 glob loader 默认将 id 设置为文件路径（例如 "1_Markdown_测试.md"）
    // 为了生成干净的 URL，我们需要手动去掉扩展名作为 slug
    // 如果不这样做，URL 可能会变成 /posts/1_Markdown_测试.md
    const cleanSlug = post.id.replace(/\.md$/, '')

    return {
      id: post.id, // 原始 ID (通常是文件名包含扩展名)
      slug: cleanSlug, // 用于 URL 的 slug (无扩展名)
      title: post.data.title,
      date: dateString,
      year: year,
      summary: post.data.description,
      tags: post.data.tags,
      data: post.data,
      collectionEntry: post, // 保留原始条目用于 render()
    }
  })

  // 按日期倒序排序 (最新的在前面)
  return formattedPosts.sort(
    (a, b) =>
      new Date(b.data.createdAt).getTime() -
      new Date(a.data.createdAt).getTime(),
  )
}
