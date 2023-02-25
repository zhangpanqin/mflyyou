import { defineConfig } from "vuepress/config";
import {
    Sidebar4ZH,
    NavItems4ZH,
} from "./config/index";

export default defineConfig({
    title: "张攀钦的博客",
    base: "/mflyyou/",
    locales: {
        "/": {
            lang: "zh-CN",
            title: "Mflyyou",
            description: "张攀钦的学习笔记及博客",
        },
    },
    head: [
        ["link", { rel: "icon", href: `/logo.png` }],
        ["meta", { name: "robots", content: "all" }],
        ["meta", { name: "author", content: "张攀钦" }],
        [
            "meta",
            {
                "http-equiv": "Cache-Control",
                content: "max-age=604800",
            },
        ],
        [
            "meta",
            {
                name: "keywords",
                content: "张攀钦的学习笔记",
            },
        ],

    ],
    themeConfig: {
        docsRepo: "zhangpanqin/mflyyou",
        docsDir: "docs",
        docsBranch: "main",
        editLinks: true,
        sidebarDepth: 0,
        smoothScroll: true,
        editLinkText: "在 GitHub 上编辑此页",
        locales: {
            "/": {
                label: "简体中文",
                selectText: "Languages",
                editLinkText: "在 GitHub 上编辑此页",
                lastUpdated: "上次更新",
                nav: [
                    {
                        text: "开发工具",
                        items: [
                            {
                                text: "Git",
                                link: "/md/dev-tools/git.md",
                            },
                            {
                                text: "iTerm2",
                                link: "/md/dev-tools/iterm2.md",
                            },
                            {
                                text: "Mac",
                                link: "/md/dev-tools/mac.md",
                            },
                        ],
                    },
                    {
                        text: "DevOps",
                        items: [
                            {
                                text: "Terraform",
                                link: "/md/devops/terraform/terraform.md",
                            },
                        ],
                    },
                ],
                sidebar: "auto",
            },
            '/zh/': {
                label: '简体中文',
                selectText: '选择语言',
                ariaLabel: '选择语言',
                editLinkText: '在 GitHub 上编辑此页',
                lastUpdated: '上次更新',
                nav: NavItems4ZH,
                sidebar: Sidebar4ZH
            }
        },
    },
    plugins: [
        ["@vuepress/back-to-top", true],
        ["@vuepress/medium-zoom", true],
        ["vuepress-plugin-code-copy"],
        [
            "@vuepress/pwa",
            {
                serviceWorker: true,
                updatePopup: true,
            },
        ],
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
                before: info => `<UpgradePath title="${info}">`,
                after: '</UpgradePath>'
            }
        ],
    ],
});
