// @ts-check

import cloudflare from '@astrojs/cloudflare'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import icon from 'astro-icon'

// https://astro.build/config
export default defineConfig({
  output: 'static',

  site: 'https://tawawa.moe',

  // 使用 Cloudflare 适配器
  adapter: cloudflare({
    imageService: 'compile', // 静态站点在构建时处理图片
  }),

  integrations: [icon()],

  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
})
