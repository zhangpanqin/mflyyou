import { SidebarConfigArray } from 'vuepress/config'


export function getJava(): SidebarConfigArray {
    const sidebar: SidebarConfigArray = [
        {
            title: 'Java 基础',
            collapsable: false,
            children: [
                'base/java-messy-code',
                'base/java-run-command.md',
                'base/java-reference',
                'base/how-to-read-file-in-java',
                'base/java-asynchronous-programming',
            ]
        },
        {
            title: 'IO',
            collapsable: false,
            children: [
                'io/io-module',
                'io/java-io',
                'io/java-nio',
            ]
        },
        {
            title: 'JUC',
            collapsable: false,
            children: [
                'juc/synchronized',
                'juc/volatile',
                'juc/thread-pool-executor',
            ]
        },
        {
            title: "JVM",
            collapsable: false,
            children: [
                'jvm/jvm-memory-model',
                'jvm/jvm-gc'
            ]
        }
    ]
    return sidebar
}

export function getGo(): SidebarConfigArray {
    const sidebar: SidebarConfigArray = [
        {
            title: 'Go 基础',
            collapsable: false,
            children: [
                'base/go-command',
                'base/recover-panic'
            ]
        }
    ]
    return sidebar
}


export function getSpringboot(): SidebarConfigArray {
    const sidebar: SidebarConfigArray = [
        {
            title: "项目总结",
            collapsable: false,
            path: "project-sumary",
        },
        {
            title: "属性配置",
            collapsable: false,
            path: 'externalized-configuration',
        },
        {
            title: "数据库连接池",
            collapsable: false,
            path: 'datasource',
        }]
    return sidebar;
}

export function getTcpIp(): SidebarConfigArray {
    const sidebar: SidebarConfigArray = [
        {
            title: 'HTTP',
            collapsable: false,
            children: [
                {
                    title: "HTTP 缓存",
                    collapsable: false,
                    path: "http/http-caching",
                },
                {
                    title: "跨域",
                    collapsable: false,
                    path: "http/http-cors-jsonp",
                }
            ]
        },
        {
            title: 'TCP/IP',
            collapsable: false,
            children: [
                {
                    title: "TCP/IP 三次握手，四次挥手",
                    collapsable: false,
                    path: "tcp-ip",
                },
            ]
        },]
    return sidebar;
}

export function getDevTools(): SidebarConfigArray {
    const sidebar: SidebarConfigArray = [
        {
            title: 'asdf 工具多版本管理',
            collapsable: false,
            children: [
                'asdf'
            ]
        },
        {
            title: 'Git',
            collapsable: false,
            children: [
                'git'
            ]
        }, {
            title: 'Brew',
            collapsable: false,
            children: [
                'brew'
            ]
        }, {
            title: 'Iterm2',
            collapsable: false,
            children: [
                'iterm2'
            ]
        }, {
            title: 'Gradle',
            collapsable: false,
            children: [
                'gradle'
            ]
        }, {
            title: 'Maven',
            collapsable: false,
            children: [
                'maven'
            ]
        }, {
            title: 'Mac',
            collapsable: false,
            children: [
                'mac'
            ]
        }, {
            title: 'Pre-commit',
            collapsable: false,
            children: [
                'pre-commit'
            ]
        },
    ]

    return sidebar;
}

export function getDevops(): SidebarConfigArray {
    const sidebar: SidebarConfigArray = [
        {
            title: 'Docker',
            collapsable: false,
            children: [
                'docker/'
            ]
        },
        {
            title: 'Terraform',
            collapsable: false,
            children: [
                'terraform/'
            ]
        },
        {
            title: 'AWS',
            collapsable: false,
            children: [
                'aws/',
            ]
        },
        {
            title: 'Linux',
            collapsable: false,
            children: [
                'linux/linux-base',
                'linux/vim',
                'linux/ssh',
                'linux/redirect-pipeline',
                'linux/debian',
                'linux/shell-base',
                'linux/shell-example',
            ]
        },
        {
            title: 'auth0',
            collapsable: false,
            children: [
                'auth0/auth0'
            ]
        },
        {
            title: 'Nginx',
            collapsable: false,
            children: [
                'nginx/nginx-base',
                'nginx/nginx-config',
                'nginx/nginx-performance',
            ]
        },
        {
            title: '数据库',
            collapsable: false,
            children: [
                {
                    title: 'Mysql',
                    collapsable: false,
                    children: [
                        'database/mysql/',
                        'database/mysql/mysql-index',
                        'database/mysql/mysql-lock-and-transaction',
                        'database/mysql/mysql-explain-optimization',
                        'database/mysql/mysql-account-management',
                        'database/mysql/mysql-backup-recovery',
                        'database/mysql/mysql-data',
                    ]
                },
                {
                    title: 'PostgreSql',
                    collapsable: false,
                    children: [
                        'database/postgresql/postgresql'
                    ]
                },
            ]
        },
        {
            title: 'Elasticsearch',
            collapsable: false,
            children: [
                'elasticsearch/es'
            ]
        },
        {
            title: 'Redis',
            collapsable: false,
            children: [
                'redis/redis'
            ]
        },
        {
            title: 'vue',
            collapsable: false,
            children: [
                'vue/vue-depoly',
            ]
        }
    ]
    return sidebar
}

export function getGuideSidebar(groupA, groupB): SidebarConfigArray {
    const sidebar: SidebarConfigArray = [
        {
            title: groupA,
            collapsable: false,
            children: [
                '',
                'getting-started',
                'directory-structure',
                'basic-config',
                'typescript-as-config',
                'assets',
                'markdown',
                'using-vue',
                'i18n',
                'deploy'
            ]
        },
        {
            title: groupB,
            collapsable: false,
            children: [
                'frontmatter',
                'permalinks',
                'markdown-slot',
                'global-computed'
            ]
        }
    ]
    return sidebar
}
