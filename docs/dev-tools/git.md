

## Hooks

### Commit message

```shell
#!/bin/bash
set -eo pipefail

RED='\033[0;31m'
Green='\033[0;32m'
NC='\033[0m'
MSG_CONTENT=$(cat "$1")

# Initialize constants here
REGEX="^\[(.*)\] (feat|fix|docs|style|refactor|test|build|ci|perf|release)(\(((.+)-[0-9]{1,}|N\/A)\): (.+))"
NOTICE="A valid commit message looks like:  ${Green}[a & b] feat(XX-123): hello, world!${NC}"
echo "$MSG_CONTENT"
if [[ ! $MSG_CONTENT =~ $REGEX ]]; then
	echo -e "${RED}invalid commit message format!${NC}"
	echo -e "$NOTICE"
	exit 1
fi
```

### Tag message

```shell
#!/bin/bash
set -eo pipefail

RED='\033[0;31m'
Green='\033[0;32m'
NC='\033[0m'

REGEX="^\[(.*)\] (feat|fix|docs|style|refactor|test|build|ci|perf|release)(\(((.+)-[0-9]{1,}|N\/A)\): (.+))"

function validate {
  local message="$2"
  if [[ ! "$message" =~ $REGEX ]]; then
    echo -e "${RED}The message format of tag \"$1\" is invalid!${NC}. A valid tag message looks like:  ${Green}[a & b] feat(XX-123): hello, world!${NC}"
    echo "Message: \"$message\""
    exit 1
  fi
}
# PRE_COMMIT_LOCAL_BRANCH 是 pre-commit 设置的环境变量
if [[ "$PRE_COMMIT_LOCAL_BRANCH" == *"refs/tags/"* ]]
then
  tag_name=$(echo "$PRE_COMMIT_LOCAL_BRANCH" | sed 's/refs\/tags\/\(.*\)/\1/')
  tag_message=$(git show -s --pretty=full "$tag_name" | sed -n 4p | xargs)

  validate "$tag_name" "$tag_message"
fi

```



## 配置

### 某个目录下 git 配置

#### ~/.gitconfig

```git
[user]
name = zhangpanqin
email = zhangpanqin@outlook.com
[core]
autocrlf = input
[includeIf "gitdir:/Users/panqinzhang/xx/"]
path = /Users/panqinzhang/xx/.gitconfig
```
#### /Users/panqinzhang/xx/.gitconfig

```git
[core]
sshCommand = ssh -i ~/.ssh/id_rsa_xx
[commit]
gpgSign = true
[user]
signingkey = D7157434BC92C13C
name = xx
email = xx
```

### 某个 git 仓库士通特定的 private secret

```shell
git config --local user.name xx
git config --local user.email xxx
git config --local commit.gpgSign true
git config --local user.signingkey D7157434BC92C13C
git config --local core.sshCommand "ssh -o IdentitiesOnly=yes -i ~/.ssh/id_rsa_rba"
```

### 配置 gpg

```shell
# 不需要在 ~/.zshrc 配置 export GPG_TTY=$(tty)
brew install pinentry-mac
echo "pinentry-program /usr/local/bin/pinentry-mac" >> ~/.gnupg/gpg-agent.conf
killall gpg-agent
```



## git submodule

可以在仓库下关联另一个仓库
```shell
# 生成 .shared folder 或者 clone 代码
git submodule update --init

# 第一次初始化添加 .shared 关联那个仓库地址
git submodule add <git repo url> .shared

# 在根目录更新 .shared 代码
git submodule update --remote --rebase
```