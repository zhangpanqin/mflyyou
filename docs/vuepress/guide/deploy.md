# 部署

下述的指南基于以下条件：

-   文档放置在项目的 `docs` 目录中；
-   使用的是默认的构建输出位置；
-   VuePress 以本地依赖的形式被安装到你的项目中，并且配置了如下的 npm scripts:

```json
{
    "scripts": {
        "docs:build": "vuepress build docs"
    }
}
```

## 云开发 CloudBase

[云开发 CloudBase](https://cloudbase.net/?site=vuepress) 是一个云原生一体化的 Serverless 云平台，支持静态网站、容器等多种托管能力，并提供简便的部署工具 [CloudBase Framework](https://cloudbase.net/framework.html?site=vuepress) 来一键部署应用。
