#!/usr/bin/env node

/**
 * Fetch all open issues from a GitHub repository and save them as markdown
 * files inside src/content/blog following the pattern ${issue.id}_${title}.md.
 *
 * Usage:
 *   node scripts/fetch-issues.mjs <owner> <repo>
 *
 * Environment variables:
 *   GITHUB_OWNER - if set, used as fallback for <owner>
 *   GITHUB_REPO  - if set, used as fallback for <repo>
 *   GITHUB_TOKEN - optional, recommended to avoid rate limits
 */

import { existsSync } from 'node:fs'
import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Octokit } from 'octokit'

const args = process.argv.slice(2)
const owner = args[0] || process.env.GITHUB_OWNER
const repo = args[1] || process.env.GITHUB_REPO

if (!owner || !repo) {
  console.error('Usage: node scripts/fetch-issues.mjs <owner> <repo>')
  console.error(
    'You can also provide owner/repo via GITHUB_OWNER and GITHUB_REPO.',
  )
  process.exit(1)
}

const token = process.env.GITHUB_TOKEN
const octokit = new Octokit(token ? { auth: token } : {})

const perPage = 100
let page = 1
const issues = []
const ownerLogin = owner.toLowerCase()
let skippedIssues = 0

try {
  // 主循环：分页调用 GitHub API 获取仓库内所有打开状态的 Issue
  while (true) {
    const { data } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: 'open',
      per_page: perPage,
      page,
    })

    if (!data.length) {
      break
    }

    // 过滤掉 PR，同时仅保留由仓库所有者创建的 Issue
    const withoutPrs = data.filter((item) => !item.pull_request)
    const ownIssues = withoutPrs.filter((item) => {
      const isOwner = item.user?.login?.toLowerCase() === ownerLogin
      if (!isOwner) {
        skippedIssues += 1
      }
      return isOwner
    })
    issues.push(...ownIssues)

    if (data.length < perPage) {
      break
    }

    page += 1
  }

  // 计算本地内容目录并清理已关闭 Issue 对应的 Markdown 文件
  const targetDir = path.resolve('src/content/blog')
  const openIssueKeys = new Set(issues.map((issue) => getIssueKey(issue)))
  const removedFiles = await removeClosedIssueFiles(targetDir, openIssueKeys)

  if (!issues.length) {
    console.log(`No open issues found for ${owner}/${repo}.`)
    if (removedFiles) {
      console.log(`Removed ${removedFiles} local file(s) for closed issues.`)
    }
    process.exit(0)
  }

  if (!existsSync(targetDir)) {
    // 如目录不存在则递归创建，保证写文件不失败
    await mkdir(targetDir, { recursive: true })
  }

  // 为每个 Issue 生成 Markdown 并持久化到本地
  for (const issue of issues) {
    const fileName = buildFileName(issue)
    const filePath = path.join(targetDir, `${fileName}.md`)
    const contents = buildMarkdown(issue)
    await writeFile(filePath, contents, 'utf8')
    console.log(`Saved ${filePath}`)
  }

  // 打印汇总信息，便于 CI 日志排查
  console.log(`Fetched ${issues.length} open issues from ${owner}/${repo}.`)
  if (removedFiles) {
    console.log(`Removed ${removedFiles} local file(s) for closed issues.`)
  }
  if (skippedIssues) {
    console.log(
      `Filtered out ${skippedIssues} issue(s) not opened by ${owner}.`,
    )
  }
} catch (error) {
  console.error('Failed to fetch issues:', error)
  process.exit(1)
}

function buildFileName(issue) {
  const sanitizedTitle = issue.title
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, '_')
    .trim()
    .slice(0, 80)

  return `${getIssueKey(issue)}_${sanitizedTitle || 'untitled'}`
}

function escapeForYaml(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function summarizeBody(body) {
  if (!body) return 'No description provided.'
  const firstLine = body.split(/\r?\n/).find((line) => line.trim().length)
  return firstLine ? firstLine.trim() : 'No description provided.'
}

function buildMarkdown(issue) {
  const tags = formatTags(issue.labels)
  const metadata = [
    `title: "${escapeForYaml(issue.title)}"`,
    `issueId: ${issue.id}`,
    `issueNumber: ${issue.number}`,
    `state: "${issue.state}"`,
    `createdAt: "${issue.created_at}"`,
    `updatedAt: "${issue.updated_at}"`,
    `url: "${issue.html_url}"`,
    `author: "${issue.user?.login ?? 'unknown'}"`,
    `description: "${escapeForYaml(summarizeBody(issue.body))}"`,
    `tags: [${tags.join(', ')}]`,
  ]

  const body = issue.body ?? ''
  return `---\n${metadata.join('\n')}\n---\n\n${body}\n`
}

function formatTags(labels) {
  if (!Array.isArray(labels) || !labels.length) {
    return []
  }

  return labels
    .map((label) => {
      const name = typeof label === 'string' ? label : label?.name
      return name ? `"${escapeForYaml(name)}"` : null
    })
    .filter(Boolean)
}

async function removeClosedIssueFiles(dir, openIssueKeys) {
  if (!existsSync(dir)) {
    return 0
  }

  const entries = await readdir(dir, { withFileTypes: true })
  let removed = 0

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      continue
    }

    const key = extractIssueKey(entry.name)
    if (!key || openIssueKeys.has(key)) {
      continue
    }

    const filePath = path.join(dir, entry.name)
    await unlink(filePath)
    console.log(`Removed ${filePath}`)
    removed += 1
  }

  return removed
}

function extractIssueKey(fileName) {
  const match = /^(\d+)_/.exec(fileName)
  return match ? match[1] : null
}

function getIssueKey(issue) {
  return String(issue.number)
}
