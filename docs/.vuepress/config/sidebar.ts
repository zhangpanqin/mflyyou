import { SidebarConfig4Multiple } from 'vuepress/config'
import {
    getGuideSidebar,
    getJava,
    getSpringboot,
    getDevops,
    getTcpIp,
    getDevTools
} from './shared'

export const Sidebar4ZH: SidebarConfig4Multiple = {
    '/java/': getJava(),
    '/springboot/': getSpringboot(),
    '/dev-tools/': getDevTools(),
    '/tcp-ip/': getTcpIp(),
    '/devops/': getDevops(),
    '/vuepress/guide/': getGuideSidebar('指南', '深入'),
}

