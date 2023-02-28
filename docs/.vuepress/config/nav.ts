import { NavItem } from 'vuepress/config'

export const NavItems4ZH: NavItem[] = [
    {
        text: "开发工具",
        items: [
            {
                text: "Git",
                link: "/dev-tools/git.md",
            },
            {
                text: "iTerm2",
                link: "/dev-tools/iterm2.md",
            },
            {
                text: "Mac",
                link: "/dev-tools/mac.md",
            },
        ],
    },
    {
        text: "DevOps",
        items: [
            {
                text: "Terraform",
                link: "/devops/terraform/terraform.md",
            },
        ],
    },
    {
        text: "测试",
        items: [
            {
                text: "测试自己主题效果",
                link: "/test/",
            },
            {
                text: "用 vuepress 验证效果",
                link: "/vuepress/guide/",
            },
        ],
    },
]
