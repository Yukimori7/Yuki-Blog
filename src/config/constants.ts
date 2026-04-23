export type SocialIcon = 'github' | 'x' | 'bilibili' | 'mail'

export interface SocialLink {
  label: string
  href: string
  icon: SocialIcon
}

export const siteConfig = {
  name: "YukiMori's Blog",
  slogan: 'Code for fun, Code for ACG',
  avatar:
    '/images/avatar.jpeg',
  description: '一个记录技术、ACG 与生活灵感的个人博客。',
  navLinks: [
    { label: '首页', href: '/' },
    { label: '归档', href: '/archive/' },
    { label: '关于', href: '/about/' },
  ],
  socials: [
    { label: 'GitHub', href: 'https://github.com/Yukimori7', icon: 'github' },
    { label: 'X', href: 'https://x.com', icon: 'x' },
    { label: 'Bilibili', href: 'https://www.bilibili.com', icon: 'bilibili' },
    { label: '邮箱', href: 'mailto:hello@example.com', icon: 'mail' },
  ] satisfies SocialLink[],
  about: {
    title: '关于我',
    paragraphs: [
      '你好，我是 YukiMori，一个偏爱可读性与审美一致性的开发者。',
      '我会在这里记录 Astro 建站、前端工程实践、以及 ACG 相关内容。',
      '这个博客遵循温暖的 Claude 风格设计语言，强调阅读节奏与长期维护。',
    ],
  },
  footer: {
    copyright: `© ${new Date().getFullYear()} YukiMori`,
    poweredBy: 'Powered by Astro',
  },
} as const
