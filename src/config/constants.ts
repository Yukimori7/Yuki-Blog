export type SocialIcon = 'github' | 'x' | 'bilibili' | 'mail'

export interface SocialLink {
  label: string
  href: string
  icon: SocialIcon
}

export const siteConfig = {
  name: "YukiMori's Blog",
  slogan: 'Code for fun, Code for ACG',
  avatar: '/images/avatar.jpeg',
  description: '一个记录技术、ACG 与生活灵感的个人博客。',
  navLinks: [
    { label: '首页', href: '/' },
    { label: '归档', href: '/archive/' },
    { label: '番剧', href: '/bangumi/' },
    { label: '关于', href: '/about/' },
  ],
  socials: [
    { label: 'GitHub', href: 'https://github.com/Yukimori7', icon: 'github' },
    { label: 'X', href: 'https://x.com/yukimori_7', icon: 'x' },
    { label: 'Bilibili', href: 'https://www.bilibili.com', icon: 'bilibili' },
    { label: '邮箱', href: 'mailto:i@tawawa.com', icon: 'mail' },
  ] satisfies SocialLink[],
  footer: {
    copyright: `© ${new Date().getFullYear()} YukiMori`,
    poweredBy: 'Powered by Astro',
  },
} as const
