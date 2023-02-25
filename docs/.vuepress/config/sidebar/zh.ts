import { SidebarConfig4Multiple } from 'vuepress/config'
import {
    getApiSidebar,
    getGuideSidebar,
    getPluginSidebar,
    getThemeSidebar
} from './shared'

export const Sidebar4ZH: SidebarConfig4Multiple = {
    '/api/': getApiSidebar(),
    '/guide/': getGuideSidebar('指南', '深入'),
    '/plugin/': getPluginSidebar('插件', '介绍', '官方插件'),
    '/theme/': getThemeSidebar('主题', '介绍')
}

