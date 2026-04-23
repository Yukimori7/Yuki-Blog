import type { PostSummary } from '../types/blog'

export const ARCHIVE_PAGE_SIZE = 8

export const getArchivePageHref = (page: number) =>
  page <= 1 ? '/archive/' : `/archive/${page}/`

export const paginatePosts = (
  posts: PostSummary[],
  page: number,
  pageSize = ARCHIVE_PAGE_SIZE,
) => {
  const totalPages = Math.max(1, Math.ceil(posts.length / pageSize))
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const start = (currentPage - 1) * pageSize
  const end = start + pageSize

  return {
    totalPages,
    currentPage,
    pagePosts: posts.slice(start, end),
  }
}
