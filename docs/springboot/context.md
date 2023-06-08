---
title: SpringBoot context 和 SpringCloud bootstrap context
---

BootstrapApplicationListener 监听 `ApplicationEnvironmentPreparedEvent`.

当 ApplicationContext prepareEnvironment 的时候，会触发 BootstrapApplicationListener 会创建 BootstrapContext，BootStrapContext 会扫描其管理的 bean，并给 SpringApplication 注册了 AncestorInitializer。

ApplicationContext Initializers 的时候，调用了 AncestorInitializer ，设置 BootstrapContext 为其 parent。

SpringBootContext 和 BootStrapContext 共享 Environment 中的 PropertySources。

BootstrapImportSelectorConfiguration 加载 BootStrapContext 中的配置。
