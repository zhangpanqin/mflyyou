---
title: HomeBrew
---

### brew bundle

```shell
# 将当前 mac brew 管理的包导出到配置文件
brew bundle dump --describe --force --file="~/Desktop/Brewfile"

# 根据当前文件夹 Brewfile ，安装app
brew bundle -v
```

### 安装以前版本的应用

-   checkout 以前版本的应用

```shell
TAP=Homebrew/homebrew-core
TAP_PATH="$(brew --repository)/Library/Taps/${TAP}"
cd ${TAP_PATH}

git log Formula/kubernetes-cli.rb
git checkout -b kubernetes-cli@1.25.5 c7ed6d416a60b273213af937000fd4208ce84719
brew install Formula/kubernetes-cli.rb

# 让 brew 不更新 kubernetes-cli
brew pin kubernetes-cli

git checkout master
git branch -d kubernetes-cli@1.25.5
```

### brew extract

从当前仓库中提取某个版本的安装包

```shell
BREW_PACKAGE=kubernetes-cli
BREW_PACKAGE_VERSION=1.25.4
BREW_TAP="${USER}/${BREW_PACKAGE}"
brew tap-new ${BREW_TAP}
brew extract --version ${BREW_PACKAGE_VERSION} ${BREW_PACKAGE} ${BREW_TAP}
brew install ${BREW_TAP}/${BREW_PACKAGE}@${BREW_PACKAGE_VERSION}
```

```shell
BREW_PACKAGE=node
BREW_PACKAGE_VERSION=v18.13.0
BREW_TAP="${USER}/${BREW_PACKAGE}"
brew tap-new ${BREW_TAP}
brew extract --version ${BREW_PACKAGE_VERSION} ${BREW_PACKAGE} ${BREW_TAP}
brew install ${BREW_TAP}/${BREW_PACKAGE}@${BREW_PACKAGE_VERSION}
```
