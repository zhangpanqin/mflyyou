import { DefaultThemeConfig } from 'vuepress/config'

import { NavItems4ZH } from './nav'
import { Sidebar4ZH } from './sidebar'
export * from './plugin'
export * from './head'


export const MFlyYouThemeConfig: DefaultThemeConfig = {
    repo: 'zhangpanqin/mflyyou',
    repoLabel: 'GitHub',
    docsRepo: "zhangpanqin/mflyyou",
    docsDir: "docs",
    docsBranch: "main",
    editLinks: true,
    sidebar: 'auto',
    sidebarDepth: 2,
    smoothScroll: true,
    editLinkText: "在 GitHub 上编辑此页",
    activeHeaderLinks: true,
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
}
