import { promises as fs } from 'node:fs'
import path from 'node:path'
import { Octokit } from 'octokit'

type IssueUser = {
  login: string
}

type IssueLabel = {
  name: string
}

type Issue = {
  id: number
  number: number
  title: string
  state: 'open' | 'closed'
  created_at: string
  updated_at: string
  body: string | null
  user: IssueUser | null
  labels: Array<IssueLabel | string>
  pull_request?: unknown
}

function getRequiredEnv(key: 'GITHUB_OWNER' | 'GITHUB_REPO'): string {
  const value = process.env[key]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function getOptionalEnv(key: 'GITHUB_TOKEN'): string | undefined {
  const value = process.env[key]?.trim()
  return value || undefined
}

function sanitizeFileNamePart(input: string): string {
  return input
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+|\.+$/g, '')
}

function yamlString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function buildDescription(body: string | null, fallback: string): string {
  if (!body?.trim()) return fallback
  const line = body
    .split('\n')
    .map((item) => item.trim())
    .find((item) => item.length > 0)
  return line ?? fallback
}

function buildMarkdown(issue: Issue): string {
  const description = buildDescription(issue.body, issue.title)
  const tags = issue.labels
    .map((item) => (typeof item === 'string' ? item.trim() : item.name.trim()))
    .filter(Boolean)
  const content = issue.body?.trim() ? issue.body.trim() : 'No description.'

  const tagLines =
    tags.length > 0 ? tags.map((tag) => `  - ${yamlString(tag)}`).join('\n') : '  []'

  return [
    '---',
    `title: ${yamlString(issue.title)}`,
    `issueId: ${issue.id}`,
    `issueNumber: ${issue.number}`,
    `state: ${yamlString(issue.state)}`,
    `createAt: ${yamlString(issue.created_at)}`,
    `updatedAt: ${yamlString(issue.updated_at)}`,
    `auther: ${yamlString(issue.user?.login ?? '')}`,
    `description: ${yamlString(description)}`,
    'tags:',
    tagLines,
    '---',
    '',
    content,
    '',
  ].join('\n')
}

async function fetchAllIssuesWithOctokit(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<Issue[]> {
  const issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
    owner,
    repo,
    state: 'all',
    per_page: 100,
  })

  return issues as Issue[]
}

async function readBlogMarkdownFiles(blogDir: string): Promise<string[]> {
  const entries = await fs.readdir(blogDir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
}

async function main() {
  const owner = getRequiredEnv('GITHUB_OWNER')
  const repo = getRequiredEnv('GITHUB_REPO')
  const token = getOptionalEnv('GITHUB_TOKEN')
  const octokit = new Octokit(token ? { auth: token } : {})
  const blogDir = path.resolve(process.cwd(), 'src/content/blog')

  await fs.mkdir(blogDir, { recursive: true })

  console.log(`[Start] Sync issues for ${owner}/${repo}`)
  console.log(`[Config] blogDir=${blogDir}`)
  console.log('[Config] source=env(GITHUB_OWNER,GITHUB_REPO,GITHUB_TOKEN?)')
  console.log(`[Config] token=${token ? 'provided' : 'not provided (may hit API rate limits)'}`)

  const repoData = await octokit.rest.repos.get({ owner, repo })
  const ownerLogin = repoData.data.owner.login.toLowerCase()
  console.log(`[Config] repoOwner=${repoData.data.owner.login}`)

  const allIssues = await fetchAllIssuesWithOctokit(octokit, owner, repo)
  const pureIssues = allIssues.filter((item) => !item.pull_request)
  const ownerFiltered = pureIssues.filter(
    (item) => (item.user?.login ?? '').toLowerCase() === ownerLogin
  )
  for (const issue of pureIssues) {
    const excludedNotOwner = (issue.user?.login ?? '').toLowerCase() !== ownerLogin
    console.log(
      `[Issue] #${issue.number} | state=${issue.state} | user=${issue.user?.login ?? 'unknown'} | excludedNotOwner=${excludedNotOwner}`
    )
  }
  const openIssues = ownerFiltered.filter((item) => item.state === 'open')
  const closedIssueNumbers = new Set(
    ownerFiltered.filter((item) => item.state === 'closed').map((item) => item.number)
  )

  console.log(`[Stats] total(raw): ${allIssues.length}`)
  console.log(`[Stats] total(issues-only): ${pureIssues.length}`)
  console.log(`[Stats] excluded(non-owner issues): ${pureIssues.length - ownerFiltered.length}`)
  console.log(`[Stats] open(after filter): ${openIssues.length}`)
  console.log(`[Stats] closed(after filter): ${closedIssueNumbers.size}`)

  const existingFiles = await readBlogMarkdownFiles(blogDir)
  const removedFiles: string[] = []
  const writtenFiles: string[] = []

  for (const fileName of existingFiles) {
    const match = /^(\d+)-.+\.md$/.exec(fileName)
    if (!match) continue

    const issueNumber = Number(match[1])
    if (!closedIssueNumbers.has(issueNumber)) continue

    const fullPath = path.join(blogDir, fileName)
    await fs.unlink(fullPath)
    removedFiles.push(fileName)
    console.log(`[Clean] removed closed issue file: ${fileName}`)
  }

  for (const issue of openIssues) {
    const safeTitle = sanitizeFileNamePart(issue.title) || `issue-${issue.number}`
    const targetFile = `${issue.number}-${safeTitle}.md`
    const targetPath = path.join(blogDir, targetFile)

    const sameNumberFiles = existingFiles.filter((name) => name.startsWith(`${issue.number}-`))
    for (const oldName of sameNumberFiles) {
      if (oldName === targetFile) continue
      const oldPath = path.join(blogDir, oldName)
      try {
        await fs.unlink(oldPath)
        removedFiles.push(oldName)
        console.log(`[Clean] removed stale title file: ${oldName}`)
      } catch {
        // Ignore deletion failure for already-removed files.
      }
    }

    const markdown = buildMarkdown(issue)
    await fs.writeFile(targetPath, markdown, 'utf8')
    writtenFiles.push(targetFile)
    console.log(`[Write] ${targetFile}`)
  }

  console.log(`[Done] written=${writtenFiles.length}, removed=${removedFiles.length}`)
  if (writtenFiles.length > 0) {
    console.log('[Done] written files:')
    for (const file of writtenFiles) console.log(`  - ${file}`)
  }
  if (removedFiles.length > 0) {
    console.log('[Done] removed files:')
    for (const file of removedFiles) console.log(`  - ${file}`)
  }
}

main().catch((error) => {
  console.error('[Error] sync failed')
  console.error(error)
  process.exit(1)
})
