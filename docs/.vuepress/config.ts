import { defineConfig } from 'vuepress/config'
import {
    MFlyYouThemeConfig,
    MFlyYouPlugin,
    MFlyYouHeads
} from './config/theme'
import { MflyyouConfig } from './config/env_config';
export default defineConfig(ctx => ({
    head: MFlyYouHeads,
    themeConfig: MFlyYouThemeConfig,
    plugins: MFlyYouPlugin,
    title: "张攀钦的笔记",
    base: MflyyouConfig.base,
    locales: {
        "/": {
            lang: "zh-CN",
            title: "Mflyyou",
            description: "张攀钦的笔记",
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

