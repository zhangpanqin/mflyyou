# 目录结构

VuePress 遵循 **“约定优于配置”** 的原则，推荐的目录结构如下：

::: vue
.
├── docs
│   ├── .vuepress _(**可选的**)_
│   │   ├── `components` _(**可选的**)_
│   │   ├── `theme` _(**可选的**)_
│   │   │ └── Layout.vue
│   │   ├── `public` _(**可选的**)_
│   │   ├── `styles` _(**可选的**)_
│   │   │   ├── index.styl
│   │   │   └── palette.styl
│   │   ├── `templates` _(**可选的, 谨慎配置**)_
│   │   │   ├── dev.html
│   │   │   └── ssr.html
│   │   ├── `config.js` _(**可选的**)_
│   │   └── `enhanceApp.js` _(**可选的**)_
│   │ 
│   ├── README.md
│   ├── guide
│   │   └── README.md
│   └── config.md
│ 
└── package.json
:::
