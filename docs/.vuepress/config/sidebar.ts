import { SidebarConfig4Multiple } from 'vuepress/config'
import {
    getGuideSidebar,
} from './shared'

export const Sidebar4ZH: SidebarConfig4Multiple = {
    '/vuepress/guide/': getGuideSidebar('指南', '深入'),
}

