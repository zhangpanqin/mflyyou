import { defineConfig } from 'vuepress/config'
import {
    Sidebar4ZH,
    NavItems4ZH
} from './config/index'

export default defineConfig({
    dest: '../../vuepress',
    head: [
        ['link', { rel: 'icon', href: `/logo.png` }],
        ['link', { rel: 'manifest', href: '/manifest.json' }],
        ['meta', { name: 'theme-color', content: '#3eaf7c' }],
        ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
        [
            'meta',
            { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }
        ],
        [
            'link',
            { rel: 'apple-touch-icon', href: `/icons/apple-touch-icon-152x152.png` }
        ],
        [
            'link',
            {
                rel: 'mask-icon',
                href: '/icons/safari-pinned-tab.svg',
                color: '#3eaf7c'
            }
        ],
        [
            'meta',
            {
                name: 'msapplication-TileImage',
                content: '/icons/msapplication-icon-144x144.png'
            }
        ],
        ['meta', { name: 'msapplication-TileColor', content: '#000000' }]
    ],
    locales: {
        '/': {
            lang: 'zh-CN',
            title: 'VuePress',
            description: 'Vue 驱动的静态网站生成器'
        }
    },
    themeConfig: {
        repo: 'vuejs/vuepress',
        editLinks: true,
        docsDir: 'packages/docs/docs',
        smoothScroll: true,
        locales: {
            '/': {
                label: '简体中文',
                selectText: '选择语言',
                ariaLabel: '选择语言',
                editLinkText: '在 GitHub 上编辑此页',
                lastUpdated: '上次更新',
                nav: NavItems4ZH,
                sidebar: Sidebar4ZH
            }
        }
    },
    plugins: [
        ['@vuepress/back-to-top', true],
        [
            '@vuepress/pwa',
            {
                serviceWorker: true,
                updatePopup: true
            }
        ],
        ['@vuepress/medium-zoom', true],
        [
            'vuepress-plugin-container',
            {
                type: 'vue',
                before: '<pre class="vue-container"><code>',
                after: '</code></pre>'
            }
        ],
        [
            'vuepress-plugin-container',
            {
                type: 'upgrade',
                before: (info: any) => `<UpgradePath title="${info}">`,
                after: '</UpgradePath>'
            }
        ],
        ['vuepress-plugin-flowchart']
    ]
});
