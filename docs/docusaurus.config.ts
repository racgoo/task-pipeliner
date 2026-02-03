import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config = {
  title: 'task-pipeliner',
  tagline: 'Condition-based Task Pipeline Runner',
  favicon: 'img/favicon.webp',

  // Search engine verification meta tags
  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'naver-site-verification',
        content: '77a4a09fece796bd4fa7255765d26d1423668145',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'google-site-verification',
        content: 'gHMQecBahjJp-OgwtlcTn5DwJTEXvtLGHrc9iOdh8ac',
      },
    },
  ],

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://task-pipeliner.racgoo.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',
  trailingSlash: true,

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'racgoo', // Usually your GitHub org/user name.
  projectName: 'task-pipeliner', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'en'],
    localeConfigs: {
      ko: {
        label: '한국어',
        direction: 'ltr',
        path: 'ko', // 한글도 /ko/ 경로 사용
      },
      en: {
        label: 'English',
        direction: 'ltr',
        path: 'en',
      },
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs', // Explicitly set docs route
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/racgoo/task-pipeliner/tree/main/docs/',
        },
        blog: false,
        pages: {
          // Enable pages plugin for all locales
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    metadata: [
      {
        name: 'description',
        content: 'A modern workflow automation tool that lets you define complex task pipelines using simple YAML or JSON files. Supports conditional execution, parallel processing, and interactive prompts.',
      },
      {
        property: 'og:description',
        content: 'A modern workflow automation tool that lets you define complex task pipelines using simple YAML or JSON files.',
      },
    ],
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'task-pipeliner',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'localeDropdown',
          position: 'right',
          label: 'Language',
        },
        {
          href: 'https://github.com/racgoo/task-pipeliner',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: 'docs/getting-started',
            },
            {
              label: 'DSL Reference',
              to: 'docs/dsl-reference/workflow-structure',
            },
            {
              label: 'Examples',
              to: 'docs/examples',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/racgoo/task-pipeliner',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/task-pipeliner',
            },
          ],
        },
      ]
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
} satisfies Config;

export default config;
