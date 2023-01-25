// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'wiki & blog',
  tagline: '',
  url: 'https://wiki.jeiizou.site',
  baseUrl: '/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'jeiizou', // Usually your GitHub org/user name.
  projectName: 'wiki.jeiizou.site', // Usually your repo name.
  deploymentBranch: 'main',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  markdown: {
    mermaid: true,
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/'
        },
        blog: {
          showReadingTime: true,
          blogSidebarTitle: '全部博文',
          feedOptions: {
            type: 'all',
            copyright: `Copyright © ${new Date().getFullYear()} WIKI.JEIIZOU.SITE, Inc.`,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/'
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'WIKI.JEIIZOU.SITE',
        // style: 'dark',
        hideOnScroll: true,
        // logo: {
        //   alt: 'My Site Logo',
        //   src: 'img/logo.svg'
        // },
        items: [
          {
            type: 'doc',
            docId: 'index',
            position: 'right',
            label: 'Wiki',
          },
          { to: '/blog', label: 'Blog', position: 'right' },
          {
            href: 'https://github.com/jeiizou',
            label: 'GitHub',
            position: 'right',
          },
          {
            type: 'search',
            position: 'right',
          },
        ],
      },
      footer: {
        // style: 'dark',
        links: [
          // {
          //   title: 'Docs',
          //   items: [
          //     {
          //       label: 'Tutorial',
          //       to: '/docs/intro'
          //     }
          //   ]
          // },
          // {
          //   title: 'Community',
          //   items: [
          //     {
          //       label: 'Stack Overflow',
          //       href: 'https://stackoverflow.com/questions/tagged/docusaurus'
          //     },
          //     {
          //       label: 'Discord',
          //       href: 'https://discordapp.com/invite/docusaurus'
          //     },
          //     {
          //       label: 'Twitter',
          //       href: 'https://twitter.com/docusaurus'
          //     }
          //   ]
          // },
          // {
          //   title: 'More',
          //   items: [
          //     {
          //       label: 'Blog',
          //       to: '/blog'
          //     },
          //     {
          //       label: 'GitHub',
          //       href: 'https://github.com/facebook/docusaurus'
          //     }
          //   ]
          // }
        ],
        copyright: `Copyright © ${new Date().getFullYear()} WIKI.JEIIZOU.SITE, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
      algolia: {
        // Algolia 提供的应用 ID
        appId: 'R2IYF7ETH7',
        //  公开 API 密钥：提交它没有危险
        apiKey: '599cec31baffa4868cae4e79f180729b',
        indexName: 'docsearch',
      },
    }),

  plugins: [
    async function myPlugin(context, options) {
      return {
        name: 'docusaurus-tailwindcss',
        configurePostCss(postcssOptions) {
          // Appends TailwindCSS and AutoPrefixer.
          postcssOptions.plugins.push(require('tailwindcss'));
          postcssOptions.plugins.push(require('autoprefixer'));
          return postcssOptions;
        },
      };
    },
    'docusaurus-plugin-sass',
    '@docusaurus/theme-mermaid',
  ],
};

module.exports = config;
