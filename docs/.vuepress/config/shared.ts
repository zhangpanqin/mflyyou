import { SidebarConfigArray } from 'vuepress/config'


export function getJava(): SidebarConfigArray {
    const sidebar: SidebarConfigArray = [
        {
            title: 'Java 基础',
            collapsable: false,
            children: [
                'base/java-messy-code',
                'base/java-reference',
                'base/how-to-read-file-in-java',
                'base/java-asynchronous-programming',
            ]
        },
        {
            title: 'IO',
            collapsable: false,
            children: [
                'io-module',
                'java-io',
                'java-nio',
            ]
        },
        {
            title: 'JUC',
            collapsable: false,
            children: [
                'synchronized',
                'volatile',
                'thread-pool-executor',
            ]
        },
        {
            title: "JVM",
            collapsable: false,
            children: [
                'jvm-memory-model',
                'jvm-gc'
            ]
        }
    ]
    return sidebar
}


export function getSpringboot(): SidebarConfigArray {
    return ['project-sumary', 'jpa/jpa'];
}

export function getTcpIp(): SidebarConfigArray {
    return ['tcp/ip', 'http/http-cors-jsonp'];
}

export function getDevTools(): SidebarConfigArray {
    return [
        'git',
        'brew',
        'iterm2',
        'gradle',
        'maven',
        'mac',
        'pre-commit',
    ];
}

export function getDevops(): SidebarConfigArray {
    const sidebar: SidebarConfigArray = [
        {
            title: 'Devops',
            collapsable: false,
            children: [
                'docker',
                'terraform/terraform',
                'aws',
            ]
        },
        {
            title: 'Shell',
            collapsable: false,
            children: [
                'linux-base',
                'shell-bash',
                'shell-example',
            ]
        },
        {
            title: 'Nginx',
            collapsable: false,
            children: [
                'nginx-base',
                'nginx-config',
                'nginx-performance',
            ]
        },
        {
            title: '数据库',
            collapsable: false,
            path: 'database',
            children: [
                {
                    title: 'Mysql',
                    collapsable: false,
                    path: 'mysql',
                    children: [
                        '',
                        'mysql-index',
                        'mysql-lock-and-transaction',
                        'mysql-explain-optimization',
                        'mysql-account-management',
                        'mysql-backup-recovery',
                        'mysql-data',
                    ]
                },
                {
                    title: 'PostgreSql',
                    collapsable: false,
                    path: 'postgresql',
                    children: [
                        'postgresql'
                    ]
                },
            ]
        },
        {
            title: 'Elasticsearch',
            collapsable: false,
            path: 'elasticsearch',
            children: [
                'es'
            ]
        },
        {
            title: 'Redis',
            collapsable: false,
            path: 'redis',
            children: [
                'redis'
            ]
        },
        {
            title: 'vue',
            collapsable: false,
            path: 'vue',
            children: [
                'vue-depoly',
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
