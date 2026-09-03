import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://docs.z-cms.org',
  redirects: {
    '/': '/vi/',
  },
  integrations: [
    starlight({
      title: {
        vi: 'Tài liệu Z-CMS',
        en: 'Z-CMS Documentation',
        ja: 'Z-CMS ドキュメント',
      },
      description: 'Hướng dẫn sử dụng, phát triển và vận hành Z-CMS.',
      favicon: '/favicon.png',
      head: [
        { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
        { tag: 'meta', attrs: { property: 'og:image', content: 'https://docs.z-cms.org/apple-touch-icon.png' } },
      ],
      defaultLocale: 'vi',
      locales: {
        vi: { label: 'Tiếng Việt', lang: 'vi' },
        en: { label: 'English', lang: 'en' },
        ja: { label: '日本語', lang: 'ja' },
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/zscontributor/z-cms-docs',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/zscontributor/z-cms-docs/edit/main/',
      },
      components: {
        SiteTitle: './src/components/TitleOnlySiteTitle.astro',
      },
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Người dùng',
          translations: { en: 'Users', ja: '利用ガイド' },
          items: [{ autogenerate: { directory: 'users', collapsed: false } }],
        },
        {
          label: 'Lập trình viên',
          translations: { en: 'Developers', ja: '開発ガイド' },
          items: [
            { slug: 'developers/getting-started' },
            {
              label: 'Kiến thức nền tảng',
              translations: { en: 'Core concepts', ja: '基本概念' },
              collapsed: true,
              items: [{ autogenerate: { directory: 'developers/core-concepts' } }],
            },
            {
              label: 'Phát triển plugin',
              translations: { en: 'Plugin handbook', ja: 'プラグイン開発' },
              collapsed: true,
              items: [{ autogenerate: { directory: 'developers/plugin-handbook' } }],
            },
            {
              label: 'Phát triển theme',
              translations: { en: 'Theme handbook', ja: 'テーマ開発' },
              collapsed: true,
              items: [{ autogenerate: { directory: 'developers/theme-handbook' } }],
            },
            { slug: 'developers/cli' },
            { slug: 'developers/api-reference' },
          ],
        },
        {
          label: 'Vận hành',
          translations: { en: 'Operators', ja: '運用ガイド' },
          items: [{ autogenerate: { directory: 'operators', collapsed: true } }],
        },
        {
          label: 'Marketplace',
          translations: { ja: 'マーケットプレイス' },
          items: [{ autogenerate: { directory: 'marketplace', collapsed: true } }],
        },
        {
          label: 'Đóng góp',
          translations: { en: 'Contributing', ja: '開発への参加' },
          items: [{ autogenerate: { directory: 'contributing', collapsed: true } }],
        },
      ],
    }),
  ],
});
