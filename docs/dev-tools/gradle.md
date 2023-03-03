# Gradle

## 前言

往期整理的 Maven 相关的博客 [你确定 Maven 相关的东西全部了解吗【原创】](https://mp.weixin.qq.com/s/WkfW3veizz3XbtbTL50KLQ)

自从 `Spring` 团队将构建工具从 `Maven` 切换到 `Gradle` 的时候就想研究 `Gradle` 。

但之前公司项目都是 `Maven` ，也没时间排期研究，一直搁置到现在。

目前项目都是 `Gradle` 构建，也有动力学了。

我看了官方的教程文档 [Gradle User Manual](https://docs.gradle.org/current/userguide/userguide.html)

我看了 《Andriod Gradle》(比较基础)，《实战 Gradle》(这个还行)，《Gradle 进阶》。

学习的 Gradle 建议，直接看官方教程就行，看书意义不是很大，遇到棘手的问题 Google 即可。

### 环境介绍

-   JDK 11
-   Gradle 6.7.1

## Gradle 项目下文件介绍

![image-20210705205617504](http://oss.mflyyou.cn/blog/20210705205617.png?author=zhangpanqin)

### wrapper 介绍

为了统一项目构建环境，我们使用 wrapper 来限制使用按个版本的工具。

```properties
# gradle-wrapper.properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
# 如果是国内项目，只需要修改这个url 就可以提高下载速度
distributionUrl=https\://services.gradle.org/distributions/gradle-6.7-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

### settings.gradle

```properties
rootProject.name = 'fly-gradle'
# include 'user-manage-service','user-manage-sdk',lib-a','lib-b'
include 'user-manage-service','user-manage-sdk'
include 'lib-a'
include 'lib-b'
```

`settings.gradle` 主要用于配置项目名称，和包含哪些子项目，include 是可以传入字符串数组的。

<img src="http://oss.mflyyou.cn/blog/20210705211220.png?author=zhangpanqin" alt="image-20210705211220522" style="zoom:50%;" />

###

### build.gradle

`build.gradle ` 可以配置项目使用的 maven 仓库，使用那些插件，依赖管理 等等。

gradle 使用的是 groovy 语言编写，所以相对 xml ，自由度更高。

### gradlew 和 gradlew.bat

`gradlew` 是 macos 和 linux 系统下，gradle 的执行命令。

`gradlew.bat` 是 windows 系统下使用的。

### Maven 私服配置

在父项目配置如下

```txt
allprojects {
    repositories {
        maven {
            url "${mavenPublicUrl}"
            credentials {
                username "${mavenUsername}"
                password "${mavenPassword}"
            }
        }
        mavenLocal()
      mavenCentral()
    }
}
```

当前项目配置如下

```txt
repositories {
    maven {
        url "${mavenPublicUrl}"
        credentials {
            username "${mavenUsername}"
            password "${mavenPassword}"
        }
    }
    mavenLocal()
    mavenCentral()
}
```

credentials 配置账号密码，当私服不需要权限下载的时候可以不配置

`Gradle` 会按照配置的仓库顺序查询 jar 下载。

### 依赖管理

`Gradle` classpath 有以下几种：

-   compileClasspath
-   runtimeClasspath
-   testComplileClasspath
-   testRuntimeClasspath

|                    | 插件 |     |
| ------------------ | ---- | --- |
| compileOnly        |      |     |
| implementation     |      |     |
| runtimeOnly        |      |     |
| testCompileOnly    |      |     |
| testImplementation |      |     |
| testRuntimeOnly    |      |     |
| api                |      |     |

### Plugin

-   java
-   java-lib
-   application
-   Java Platforms
-   maven publish
-   distribution

### Task

```groovy
taskhello{
    onlyIf{!project.hasProperty('skipHello')}
    doLast{
        println'hello world'
    }
}
hello.onlyIf{!project.hasProperty('skipHello')}
```

```shell
gradle build
gradle run
# 所有的验证 task，包括测试
gradle check
gradle clean
```
