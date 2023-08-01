# Git

## Git 常用配置

-   `~/.gitconfig` 保存用户 Git 的全局配置
-   `.git/config` 保存某个仓库的配置

```shell
# 查看全局配置
git config --global --list
# 查看某个仓库的配置
git config --local --list
```

### 一台电脑配置多个 github 账号

1. 在 `~/.gitconfig` 全局配置某个目录下的 git 仓库使用不同的配置。

`/Users/panqinzhang/xx/` 目录使用 `/Users/panqinzhang/xx/.gitconfig`。 别的目录还是使用默认的 ssh。

```git
[user]
name = zhangpanqin
email = zhangpanqin@outlook.com
[core]
autocrlf = input
[includeIf "gitdir:/Users/panqinzhang/xx/"]
path = /Users/panqinzhang/xx/.gitconfig
```

2. /Users/panqinzhang/xx/.gitconfig

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

### 修改某个 git 仓库特定配置

```shell
git config --local user.name xx
git config --local user.email xxx
git config --local commit.gpgSign true
git config --local user.signingkey D7157434BC92C13C
git config --local core.sshCommand "ssh -o IdentitiesOnly=yes -i ~/.ssh/id_rsa_rba"
```

修改全局使用 `--global` 。

### 配置 gpg

安装这个之后，就不需要，每次都要输入 gpg 的密码了。

```shell
# 不需要在 ~/.zshrc 配置 export GPG_TTY=$(tty)
brew install pinentry-mac
echo "pinentry-program /usr/local/bin/pinentry-mac" >> ~/.gnupg/gpg-agent.conf
killall gpg-agent
```

### 配置 .gitignore 不将那些文件纳入版本控制

```shell
# 只忽略根目录下的 a.js
/a.js
# 忽略文件名是 a.js，不管是哪个目录下
a.js
```

### 配置 .gitattributes 管理文件换行符

有的一些文件，我们在工作目录必须是 ctrf 结尾。比如 bat 脚本。

```shell
*.js  text  eol=lf
*.jsx  text eol=lf
*.json text eol=lf
*.sh text eol=lf
*.bat text eol=crlf
*.png binary
*.jpg binary
```

配置好之后运行以下命令（先 commit 未提交代码）,这样对应的文件的行结束符就显示正常了。

```shell
git rm --cached -r .
git reset --hard
```

### 配置 `.pre-commit-config.yaml`
