module.exports = {
    title: "张攀钦的博客",
    base: "/mflyyou/",
    description: "学习笔记及博客",
    shouldPrefetch: (file, type) => {
        return false;
    },
    markdown: {
        lineNumbers: true,
        externalLinks: {
            target: "_blank",
            rel: "noopener noreferrer",
        },
    },
    locales: {
        "/": {
            lang: "zh-CN",
            title: "Mflyyou",
            description: "张攀钦的学习笔记及博客",
        },
    },
    head: [
        // ico
        ["link", { rel: "icon", href: `/favicon.ico` }],
        // meta
        ["meta", { name: "robots", content: "all" }],
        ["meta", { name: "author", content: "张攀钦" }],
        [
            "meta",
            {
                "http-equiv": "Cache-Control",
                content: "no-cache, no-store, must-revalidate",
            },
        ],
        ["meta", { "http-equiv": "Pragma", content: "no-cache" }],
        ["meta", { "http-equiv": "Expires", content: "0" }],
        [
            "meta",
            {
                name: "keywords",
                content: "张攀钦的学习笔记",
            },
        ],
        ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
        [
            "script",
            {
                charset: "utf-8",
                async: "async",
                src: "/js/jquery.min.js",
            },
        ],
    ],
    plugins: [
        // [{ globalUIComponents: ["LockArticle", "PayArticle"] }],
        // See: https://github.com/francoischalifour/medium-zoom#options
        [
            "@vuepress/medium-zoom",
            {
                selector: "img:not(.nozoom)",
                options: {
                    margin: 16,
                },
            },
        ],
        // see: https://github.com/znicholasbrown/vuepress-plugin-code-copy
        [
            "vuepress-plugin-code-copy",
            {
                align: "bottom",
                color: "#3eaf7c",
            },
        ],
        // see: https://github.com/tolking/vuepress-plugin-img-lazy
        ["img-lazy", {}],
        [
            "vuepress-plugin-tags",
            {
                type: "default", // 标签预定义样式
                color: "#42b983", // 标签字体颜色
                border: "1px solid #e2faef", // 标签边框颜色
                backgroundColor: "#f0faf5", // 标签背景颜色
                selector: ".page .content__default h1", // ^v1.0.1 你要将此标签渲染挂载到哪个元素后面？默认是第一个 H1 标签后面；
            },
        ],
        // https://github.com/lorisleiva/vuepress-plugin-seo
        [
            "seo",
            {
                siteTitle: (_, $site) => $site.title,
                title: ($page) => $page.title,
                description: ($page) => $page.frontmatter.description,
                author: (_, $site) => $site.themeConfig.author,
                tags: ($page) => $page.frontmatter.tags,
                type: ($page) => "article",
                url: (_, $site, path) =>
                    ($site.themeConfig.domain || "") + path,
                image: ($page, $site) =>
                    $page.frontmatter.image &&
                    (($site.themeConfig.domain &&
                        !$page.frontmatter.image.startsWith("http")) ||
                        "") + $page.frontmatter.image,
                publishedAt: ($page) =>
                    $page.frontmatter.date && new Date($page.frontmatter.date),
                modifiedAt: ($page) =>
                    $page.lastUpdated && new Date($page.lastUpdated),
            },
        ],
    ],
    themeConfig: {
        docsRepo: "zhangpanqin/mflyyou",
        // 编辑文档的所在目录
        docsDir: "docs",
        // 文档放在一个特定的分支下：
        docsBranch: "main",
        //logo: "/logo.png",
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
                    // {
                    //     text: "首页",
                    //     link: "/README.md",
                    // },
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
                sidebar: {
                    // "/md/other/": genBarOther(),
                },
            },
        },
    },
};
