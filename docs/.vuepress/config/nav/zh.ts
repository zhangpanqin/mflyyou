import { NavItem } from 'vuepress/config'

export const NavItems4ZH: NavItem[] = [
    {
        text: '指南',
        link: '/guide/'
    },
    {
        text: '配置',
        link: '/config/'
    },
    {
        text: '插件',
        link: '/plugin/'
    },
    {
        text: '主题',
        link: '/theme/'
    },
    {
        text: '了解更多',
        ariaLabel: '了解更多',
        items: [
            {
                text: 'API',
                items: [
                    {
                        text: 'CLI',
                        link: '/api/cli.html'
                    },
                    {
                        text: 'Node',
                        link: '/api/node.html'
                    }
                ]
            },
            {
                text: '开发指南',
                items: [
                    {
                        text: '本地开发',
                        link: '/miscellaneous/local-development.html'
                    },
                    {
                        text: '设计理念',
                        link: '/miscellaneous/design-concepts.html'
                    },
                    {
                        text: 'FAQ',
                        link: '/faq/'
                    },
                    {
                        text: '术语',
                        link: '/miscellaneous/glossary.html'
                    }
                ]
            },
            {
                text: '其他',
                items: [
                    {
                        text: '从 0.x 迁移',
                        link: '/miscellaneous/migration-guide.html'
                    },
                    {
                        text: 'Changelog',
                        link: 'https://github.com/vuejs/vuepress/blob/master/CHANGELOG.md'
                    }
                ]
            }
        ]
    },
    {
        text: 'v1.x',
        items: [
            {
                text: 'v2.x',
                link: 'https://v2.vuepress.vuejs.org/'
            },
            {
                text: 'v0.x',
                link: 'https://v0.vuepress.vuejs.org/'
            }
        ]
    }
]
