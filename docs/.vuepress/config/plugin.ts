import { UserPlugins } from 'vuepress/config'

export const MFlyYouPlugin: UserPlugins = [
    ['vuepress-plugin-code-copy', true],
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
    ]
];
