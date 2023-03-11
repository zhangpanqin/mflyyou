# asdf

node， java，ruby 等等工具可能会有多个版本，为了可以方便切换这些版本，我们可以使用 [asdf](https://github.com/asdf-vm/asdf) 进行多版本管理。

我们可以在项目下使用 `.tool-versions` 文件用于版本管理。

```properties
java corretto-17.0.5.8.1
```

或者全局设置或者当前 shell 中设置

```shell
asdf global java corretto-17.0.5.8.1
asdf local java corretto-11.0.17
```

### 安装 asdf

```shell
brew install asdf
```

### 安装插件对工具进行多版本管理

```shell
asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git
asdf plugin add java https://github.com/halcyon/asdf-java.git
```

### 使用 asdf 安装工具的版本

```shell
# 先查看有哪些版本支持
asdf list all nodejs
asdf list all java
# 安装对应的版本
asdf install nodejs 18.15.0
asdf install java corretto-17.0.6.10.1
```

### 对 mac 已存在应用添加到 asdf 管理

`$ASDF_DIR/installs` 为应用的安装目录，比如我们想将本地的已安装过 java 11 让 asdf 管理：

-   将 java11 的 home 软连接到 $ASDF_DIR/installs/java

```shell
ln -s /Users/panqinzhang/Library/Java/JavaVirtualMachines/corretto-11.0.17/Contents/Home corretto-11.0.17
```

-   asdf reshim java

```shell
asdf reshim java
```
