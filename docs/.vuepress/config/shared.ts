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
                'jvm/',
                'jvm/jvm-memory-model',
                'jvm/class-loader',
                'jvm/jvm-gc',
                'jvm/jvm-gc-demo',
            ]
        },
        {
            title: "通用工具",
            collapsable: false,
            children: [
                'lib/snowflake',
                'lib/distributed_lock'
            ]
        }
    ]
    return sidebar
}

export function getGo(): SidebarConfigArray {
    const sidebar: SidebarConfigArray = [
        {
            title: 'Go 学习',
            collapsable: false,
            children: [
                ''
            ]
        },
        {
            title: 'Go 基础',
            collapsable: false,
            children: [
                'base/go-command',
                'base/func',
                'base/init-main',
                'base/pointers',
                'base/recover-panic',
                'base/variables',
            ]
        }
    ]
    return sidebar
}


export function getSpringboot(): SidebarConfigArray {
    const sidebar: SidebarConfigArray = [
        {
            title: "日常使用组件推荐",
            collapsable: false,
            path: "./",
        },
        {
            title: "基本使用",
            collapsable: false,
            children: [
                {
                    title: "属性配置",
                    collapsable: false,
                    path: 'base/externalized-configuration',
                },
                {
                    title: "Bean 的生命周期",
                    collapsable: false,
                    path: "base/bean-lifecycle",
                },
                {
                    title: "Spring Context",
                    collapsable: false,
                    path: "base/context",
                },
                {
                    title: "自动配置",
                    collapsable: false,
                    children: [
                        {
                            title: "Import 介绍",
                            collapsable: false,
                            path: "base/auto_config/import",
                        }
                    ]
                },
                {
                    title: "数据库连接池",
                    collapsable: false,
                    path: 'base/datasource',
                }
            ]
        },
        {
            title: "SpringMvc",
            collapsable: false,
            children: [
                {
                    title: "SpringMvc 介绍",
                    collapsable: false,
                    path: "spring_mvc/",
                }
            ]
        },
        {
            title: "AOP",
            collapsable: false,
            children: [
                {
                    title: "AOP 使用",
                    collapsable: false,
                    path: "aop/",
                }
            ]
        },
        {
            title: "Jackson",
            collapsable: false,
            children: [
                {
                    title: "Jackson 使用",
                    collapsable: false,
                    path: "jackson/",
                }
            ]
        },
        {
            title: "JPA",
            collapsable: false,
            children: [
                {
                    title: "JPA 使用",
                    collapsable: false,
                    path: "jpa/jpa",
                }
            ]
        },
        {
            title: "Logback",
            collapsable: false,
            children: [
                {
                    title: "Logback 和 Slf4j",
                    collapsable: false,
                    path: "logback/",
                },
                {
                    title: "Logback 日志",
                    collapsable: false,
                    path: "logback/detail",
                }
            ]
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
                {
                    title: 'Git 配置',
                    collapsable: false,
                    path: "git/git",
                },
                {
                    title: 'Git 命令',
                    collapsable: false,
                    path: "git/git-command",
                },
                {
                    title: 'Git 原理',
                    collapsable: false,
                    path: "git/git-principle",
                },
                {
                    title: 'Git Hook',
                    collapsable: false,
                    path: "git/git-hook",
                },
                {
                    title: 'Git Submodule',
                    collapsable: false,
                    path: "git/git-submodule",
                },
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
        }
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
                        'database/mysql/mysql-arch',
                        'database/mysql/mysql-index',
                        'database/mysql/mysql-lock-and-transaction',
                        'database/mysql/mysql-explain',
                        'database/mysql/mysql-limit',
                        'database/mysql/mysql-data-types',
                        'database/mysql/mysql-account-management',
                        'database/mysql/mysql-backup-recovery',
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
