# Git 命令

::: tip

如果对某个 git 命令心里没底，就把代码先提交了，让工作区没有变更的代码。

这些不管你运行什么命令都是可以找回来的，前提你不要删除你的本地仓库。

:::



## Git 基础命令

```shell
git init .
git clone [url]
git config [--global | --local] ] user.name "[name]"
git config [--global | --local] ] user.email "[email address]"
git add [file1]
git add [dir]

# 添加当前目录的所有文件到暂存区
git add .

# 停止追踪指定文件，但该文件会保留在工作区
git rm --cached [file]

# 提交暂存区到仓库区
git commit -m [message]

# 修改上一次提交的 message
git commit --amend -m [message]

# 显示有变更的文件
git status

# 显示当前分支的版本历史
git log

# 显示操作日志
git reflog

# 拉取远程代码，并 rebase 到当前分支
git pull -r

# 以列表形式查看指定文件的历史修改记录
git blame <file>
```



## Git Reset

撤消修改


```shell
git reset [ --mixed | --soft | --hard | --merge | --keep] [<commit>]
```

- `--soft` , 将 `HEAD` 指向某个 commit，工作区和暂存区的修改不会丢失。这个 commit 之前的提交会放到 暂存区。没有更改丢失。工作区没有提交的修改也不会丢失。

- `--mixed ` , 将 `HEAD` 指向某个 commit。将暂存区和这个 commit 之前的提交会放到工作区。没有更改丢失。工作区没有提交的修改也不会丢失。

- `--hard` , 将 `HEAD` 指向某个 commit。清空暂存区，不会将这个 commit 之前的提交回滚并放回工作区。

  工作区的未追踪文件不会丢失，但是暂存区丢失了。



## Git Revert

撤消修改，产生一个新的 commit。

撤消某个 commit 的提交，或者撤消一批。

```shell
git revert <commit>
```



## Git Rebase

```shell
git-rebase [<upstream> [<branch>]]
```

如果指定了 `branch` ，当前分支不是 `branch` ，git 会自动执行 `git switch <branch>` ，再去执行后续操作。

::: warn

如果某些 commit 推送到远程了，就不要对这些 commit 进行 rebase。

`git merge` 和 `git rebase` 都是对分支代码进行合并，只是 git rebase 会重写提交历史记录。

:::

### 原理实践

假设当前分支为：topic，当前的 git 树是这样的：

```
    A---B---C topic
    /
D---E---F---G master
```



```shell
git rebase master # 这个是在 topic 分支执行命令
git rebase master topic # 先切换到 topic 分支，再执行 git rebase
```



执行 `git rebase` 命令之后，分支变成以下记录

```
            A'--B'--C' topic
            /
D---E---F---G master
```

A’ 和 A （B 和 B'）hash 是不一样的。只是提交信息一样。



`git rebase master topic` 的实现逻辑是这样的：

- 如果当前分支不是 topic，先 `git switch` 切换到 topic 分支
- 寻找 topic 和 master 分支的工同的父提交，将 topic 支父提交之后的 commits 移到一个临时区域（git reset —hard）暂存
- 然后再把当前 topic 分支更新成和 master 一样
- 将临时区域的 commit 再一个一个提交回来放到 topic 分支最上面



## Git Merge




```shell
    A---B---C topic
    /
D---E---F---G master
```

```shell
git merge topic // 当前分支是 master 分支
git merge topic master
```

          A---B---C topic
          /         \
      D---E---F---G---H master
