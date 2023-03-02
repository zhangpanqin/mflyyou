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
        '@vuepress/google-analytics',
        {
            'ga': 'UA-159299742-2'
        }
    ]
];
