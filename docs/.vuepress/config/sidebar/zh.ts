import { SidebarConfig4Multiple } from 'vuepress/config'
import {
    getPluginSidebar,
} from './shared'

export const Sidebar4ZH: SidebarConfig4Multiple = {
    '/plugin/': getPluginSidebar('插件', '介绍', '官方插件'),
}

