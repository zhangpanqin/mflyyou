import { defineConfig } from 'vuepress/config'
import {
    MFlyYouThemeConfig,
    MFlyYouPlugin,
    MFlyYouHeads
} from './config/theme'

export default defineConfig(ctx => ({
    head: MFlyYouHeads,
    themeConfig: MFlyYouThemeConfig,
    plugins: MFlyYouPlugin,
    title: "张攀钦的博客",
    base: "/mflyyou/",
    locales: {
        "/": {
            lang: "zh-CN",
            title: "Mflyyou",
            description: "张攀钦的学习笔记及博客",
        },
    },
    // 监听文件变化并重新构建
    extraWatchFiles: [
        '.vuepress/**/*.ts',
        '**/*.md',
        '**/*.vue'
    ],
    evergreen: !ctx.isProd
}));

