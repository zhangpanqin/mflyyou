---
title: Linux-包教包会系列之-入门
---

## 前言

以前我的不喜欢用 `Linux` 系统，什么目录啊，文件啊，权限啊，都得命令操作，入门难度较大。但是一旦熟练起来，真不想再去用 `windows` 了。再加上 `shell` 脚本，那才叫如虎添翼啊，真的是见识到了什么才是性能，什么才是自动化。

`Linux` 相较于 `windows` 而言，占用内存更小，因为 windows 的图形化界面比较占内存。`Linux` 的生态也比较丰富，各种各样的服务端软件都会有 `Linux` 版本。`Linux` 也衍生出各种格言的版本，我用的比较多的是 `Centos`

在 Linux 中，一切皆文件。所以各种目录、文件的权限、创建者、所属组都是比较实用的东西。

本文内容基于<font color=red> `Centos 7.4`</font> 版本。

主要内容:

-   linux 目录说明
-   PATH 加载的原理及配置
-   常用简单命令
-   sed,awk,find,管道流,重定向,scp

## 目录介绍

Linux 中的目录还是要清楚的，有一些约定成俗的规定需要大家了解。

目录只介绍一些重要常用的。大致了解什么作用即可。

![image-20200320134926002](http://oss.mflyyou.cn/blog/20200320134926.png?author=zhangpanqin)

![190301204277681](http://oss.mflyyou.cn/blog/20200320144522.png?author=zhangpanqin)

### 根目录-`/`

根目录下面有许多子目录 `bin` `etc` `home` `opt` `usr` `sbin` `var` `tmp` 等等。

### `/root`

是用户 `root` 的家目录。

### `/home`

除 `root` 用户之外的其它的用户家目录。`cd ~` 就是进入当前用户的家目录。

### `/bin`

`/bin` 实际是个软连接（理解为 windows 的快捷方式），链接到 `/usr/bin`。里面都是一些二进制的执行文件。我们常用的 `yum` `su` `sudo` `cp` 都在这个目录下。通常我们安装的程序，可以在这里访问到。

### `/sbin`

`s` 指 Spuer user。

`/sbin` 也是一个软连接，链接到 `/usr/sbin` 存放二进制文件，管理员可执行的命令。

### `/etc`

`/etc` 为配置文件所在路径。比如 `/etc/nginx` 存放 `nginx` 的配置文件。

### `/usr`

`usr` 为 `unix system resources` 简写。表示系统资源的路径。

#### `/usr/bin`

所有用户的都可访问的二进制命令，不包括系统管理员的命令。

#### `/usr/share`

包含共享数据。比如 `/usr/share/nginx` 为 nginx 存放的静态资源。

#### `/usr/local`

从源码编译安装的程序安装到这里。

#### `/usr/src`

系统内核 `kernel` 源码位置。

### `/var`

程序运行产生的缓存文件，锁文件，pid 文件，日志文件等会在这个目录，一些经常会变化的内容保存的位置。

## 命令执行的优先级

我们经常用 `pwd` 获取当前目录路径，如果我自己写个 shell 脚本，命名为 `pwd`,将其加入到 `PATH` 中，那二者谁会执行呢？

这就是为什么要了解命令的优先级了。

### 命令优先级

第一优先级：指定路径的命令。绝对路径 `/home/parallels/a.sh` 或者相对路径 `./a.sh`。

第二优先级：别名指定的命令 `alias pwd=/home/parallels/a.sh`

第三优先级：内部命令(pwd)

第四优先级：hash 命令

第五优先级：通过 `PATH` 定义的查找顺序查找

如果以上顺序都找不到，就会报 `未找到命令...` 的错误。

通过 `type command` 可以查看 command 命令类型。

```bash
# clear 已被哈希 (/usr/bin/clear)，clear 哈希命令
type clear


# pwd 是 shell 内嵌。pwd 是内嵌命令。
type pwd


# java 是 /usr/bin/java，java 是通过 PATH 寻找到的命令。
type java
```

`alias pwd=/home/parallels/a.sh` 通过改写 `pwd`。

```bash
# a.sh
echo 11
```

当我执行 `pwd` 的时候，命令运行的是 `a.sh`

## PATH

### PATH 生效的原理

<font color=red>启动终端的时候会初始化命令，会加载 `/etc/profile` 和 `~/.bash_profile` </font>

`/etc/profile` 会将路径加载`/usr/local/bin` 、`/usr/bin`、`/usr/local/sbin` 、`/usr/sbin` 追加到 PATH 中去。然后将 `/etc/profile.d/*.sh` 进行初始化。

`~`对应当前登录用户的用户空间。比如我用 `flyu` 操作当前 shell，那么`~` 等于 `/home/flyu`

`~/.bash_profile` 会判断 `~/.bashrc` 存在吗，存在会运行它。

`~/.bashrc` 中会判断 `/etc/bashrc` 存在吗，存在会运行它。

`/ect/bashrc` 将 `/etc/profile.d/*.sh` 进行初始化。

### PATH 全局配置

基于以上的理解，<font color=red>全局命令配置建议直接在 `/usr/bin`下建立软连接到你的可执行文件。</font>

不要想着在 `/etc/profile.d/` 下写脚本进行配置 PATH。当脚本写错，那么你可能会配置 `PATH` 的有效性，

### PATH 用户配置

用户配置 PATH 直接在 `~/.bashrc` 中追加 PATH 即可。

```bash
PATH="${PATH}:/usr/local/aa"
export PATH
```

一般我们用 `yum` 安装环境已经给配置好了环境变量。

## 系统登录

我比较讨厌一遍一遍输入用户名和密码访问服务器。

我每次只要输入 `ssh mflyyou` 连接我的服务器。

```bash
ssh mflyyou.com
```

### 1、生成公钥私钥

```bash
ssh-keygen -o -t rsa  -b 4096
```

![img](http://oss.mflyyou.cn/blog/20200320210953.png?author=zhangpanqin)

### 2、将公钥复制到远程服务器

`.pub` 结尾是公钥。

```bash
# ssh-copy-id -i {公钥绝对路径} {远程服务器用户名}@{远程服务器 ip}
ssh-copy-id -i /Users/zhangpanqin/.ssh/test_local_server.pub parallels@10.211.55.8
```

以上命令作用是，将指定的公钥内容，拷贝到远程服务器上的指定用户`parallels`下。这样以后这个用户（parallels）就可以不用输入密码登录了。

运行上述命令将公钥内容拷贝到 /home/parallels/.ssh/authorized_keys。

![img](http://oss.mflyyou.cn/blog/20200320211111.png?author=zhangpanqin)

### 3、本地电脑配置私钥

```bas
Host mflyyou.com
  HostName 10.211.55.8
  AddKeysToAgent yes
  UseKeychain yes
  User parallels
  IdentityFile /Users/zhangpanqin/.ssh/test_local_server
```

![img](http://oss.mflyyou.cn/blog/20200320211422.png?author=zhangpanqin)

```bash
# 验证登录
# ssh -T 私钥文件 用户名@ip
ssh -T /Users/zhangpanqin/.ssh/mflyyou_server_rs mysql@192.168.10.1
```

以上配置结束，你可以 `ssh mflyyou.com` 登录远程服务器了。

## 用户管理

linux 下`用户`、`组`创建和管理。可以控制哪些`目录`和`文件`可以访问。

```bash
# 创建 mflyyou 用户,同时会创建 mflyyou 组
adduser mflyyou
```

```bash
# 修改 mflyyou 的密码，命令之后会提示你输入密码
passwd mflyyou
```

创建的用户是不具有 `sudo` 提升权限的能力，需要修改 `/etc/sudoers` 使之生效。

```bash
# 在 root 下运行，修改文件的可写性
chmod  700 /etc/sudoers

# /etc/sudoers 文件中填写 mflyyou ALL=(ALL)      PASSWD:ALL
root    ALL=(ALL)       ALL
mflyyou ALL=(ALL)      PASSWD:ALL


# 权限给了之后，修改文件 /etc/sudoers 为只读性
chmod  400 /etc/sudoers
```

## 文件权限控制

![image-20200320212048568](http://oss.mflyyou.cn/blog/20200320212048.png?author=zhangpanqin)

每行信息开头的第一个字母表示文件类型。

`d` 表示目录。

`-` 表示文件。

`l` 表示软连接。

`mkdir` 创建目录。

`touch` 创建空文件。

对文件夹或文件划分权限。 4 读 r，2 编辑 w,1 执行 x

```
chmod 754 /opt/config
```

修改 /opt/config 所属用户、用户组、其它人的访问权限。

-   所属用户：读、编辑、执行，7

-   所属组：读、执行，5

-   其他：读，4

修改文件夹或者文件的所属用户和用户组

```
# 递归修改 /opt/config 的归属 admin 用户，所属 admin 组
chown -R admin:admin  /opt/config
```

![img](https://user-gold-cdn.xitu.io/2020/1/13/16f9f1268d7b6f9e?w=1286&h=554&f=png&s=154657)

## 程序安装

### rpm

linux 分为源码包和 rpm 包。源码包需要我们自己编译，然后安装，自由度比较高。rpm 包是厂商编译好的二进制包，可以类比 windows .exe 包。但 rpm 包安装的时候需要处理依赖关系。因此，yum 管理 rpm 包诞生。yum 一般需要联网，有的时候，部署的服务器没有网络，我们可以通过挂载光盘或者 U 盘搭建本地 yum 源使用。

rpm 包安装的好处之一是我们不需要配置环境变量了。包已经内置处理好了。

比如我们安装 jdk ,通过官网下载 jdk rpm 包。

![img](http://oss.mflyyou.cn/blog/20200320231817.png?author=zhangpanqin)

#### rpm 包安装

```bash
# 安装
rpm -lvh 包全名
```

![img](http://oss.mflyyou.cn/blog/20200320231924.png?author=zhangpanqin)

#### 卸载 rpm 包

```bash
# 卸载
rpm -e 包名
```

#### 查询安装了哪些 npm 包

```bash
rpm -qa | grep nginx
```

#### 查看安装的 rpm 包的信息

```bash
# 查询安装包的信息
rpm -qi 包名
```

![image-20200320232543119](http://oss.mflyyou.cn/blog/20200320232543.png?author=zhangpanqin)

#### 查找 rpm 包会安装哪些文件及位置

```bash
# 查询包安装位置
rpm -ql 包名
```

![image-20200320232309137](http://oss.mflyyou.cn/blog/20200320232309.png?author=zhangpanqin)

#### 其他命令

```bash
# 查询文件属于的安装程序
rpm -qf 系统文件名

# 校验安装的包中的文件是否被修改
rpm -V 包名

# 升级
rpm -Uvh 包全名
```

### yum

国外的 yum 源速度较慢，使用阿里云提供了 yum 源镜像，速度挺快，给阿里点赞。

yum 实际是也是安装的 `rpm` 包，只是包之间的依赖关系由 `rpm` 管理了。

#### yum 源配置

[阿里 Centos yum 源](https://developer.aliyun.com/mirror/centos?spm=a2c6h.13651102.0.0.217a1b1181urQb)

[阿里 epel 源](https://developer.aliyun.com/mirror/epel?spm=a2c6h.13651102.0.0.217a1b1181urQb)

#### yum 命令

```bash
# 列出一个或一组软件包
yum list

# 列出已经安装包
yum list installed | grep mysql

# 在软件包详细信息中搜索指定字符串
yum search

# 安装包
yum -y install 包名

# 升级包，一定要指定包，不然 linux 全局更新
yum -y update 包名

# 卸载包，尽量不卸载
yum -y remove 包名
```

## 常用命令

`linux` 的命令不用刻意记，`-h` `-?` `man` 都可以查看命令的帮助信息。

```bash
# man，查看系统内置的命令
man find

# -h -? 一般是程序的帮助信息
nginx -h
```

### 基本命令

```bash
# 复制 a.txt 到tmp 目录下
cp a.txt /tmp
# 复制 test 目录到 /tmp,保持文件所有特性和权限一样
cp -r -a test /tmp
# 复制为软连接，快捷方式
cp -s  a.txt /tmp/a.txt


# 递归删除 test 目录及旗下内容
rm -f -r test

# 将a.txt 移动到/tmp 下
mv a.txt /tmp

# 创建文件夹
mkdir b

# 查看文本内容
cat a.txt

# 查看目录下内容
ll
# 查看目录下全部内容
ll -a


# 查看一个文件新生成内容，动态观看

tail -f -n 10 a.txt

# 有的时候，两个命令执行有 依赖关系 ，a 执行成功执行 b

a && b

# a 执行成功与否，b 都要执行

a || b
```

### cp

-   创建软连接

```bash
# 复制为软连接，快捷方式
cp -s  a.txt /tmp/a.txt
```

### scp-远程拷贝

```bash
# 将 a 目录下的所有资源 拷贝到指定远程地址的 /usr/share/nginx/html/ 下
scp -rp /a/* 用户名@ip:/usr/share/nginx/html/
```

### 重定向

Linux shell 使用 3 种标准的 I/O 流，每种流都与一个文件描述符相关联：

1. _stdout_ 是*标准输出流*，它显示来自命令的输出。它的文件描述符为 1。
2. _stderr_ 是*标准错误流*，它显示来自命令的错误输出。它的文件描述符为 2。
3. _stdin_ 是*标准输入流*，它为命令提供输入。它的文件描述符为 0。

`>` 改变输出流。`>` 等价于 `1>`

`<` 改变输入流。

```bash
# 改变输出流量,a.txt 不存在的情况下创建
echo "111" > a.txt

# 有时候我们需要将标准输出流和标准错误流输入到一个文件。a.txt 存在，bb.txt 不存在。内容不会追加。
ls a.txt bb.txt > error.log 2>&1

# 如果内容需要追加
ls a.txt bb.txt >> error.log 2>&1

# 如果不想要输出内容, 写入到 /dev/null 的内容都会被丢弃掉
ls a.txt bb.txt >> /dev/null 2>&1
```

### 管道流-`|`

多个命令通过 `|` 链接，前一个命令的输出，是后一个命令的输入。

```bash
cat error.log  | grep "a.txt"
```

### grep-查询文本

用于查询内容中符合指定格式的内容。

```bash
# 不查询指定命令
grep -v

# 忽略大小
grep -i

ps -ef | grep jail-2.0-0.0.1-SNAPSHOT.jar | grep -v grep
```

### awk-操作文本

对文本根据 `空格` 或者 `tab` 切割，然后根据操作获取符合条件的某行中某列的数据。

`$n` 获取第几个内容，`$0` 获取当前行，`$NF` 获取最后一个字段

```bash
# a2
echo "a1 a2 a3" | awk '{print $2}'

# a3
echo "a1 a2 a3" | awk '{print $NF}'

# a2
echo "a1 a2 a3" | awk '{print $(NF-1)}'
```

awk 还提供一些内置函数。其余的内置函数可以查看帮助命令。

-   `toupper()`：字符转为大写。
-   `tolower()`：字符转为小写。
-   `length()`：返回字符串长度。
-   `substr()`：返回子字符串。

```bash
# A2
echo "a1 a2 a3" | awk '{print toupper($2)}'

# a2
echo "A1 A2 A3" | awk '{print tolower($2)}'

# 9
echo "A1 123456789 A3" | awk '{print length($2)}'

#
echo "A1 123456789 A3" | awk '{print substr($2)}'
```

指定分隔符使用。

```bash
# A2
echo "a1:a2:a3" | awk -F: '{print toupper($2)}'
```

使用条件进行筛选。

log.txt

```txt
a1 a2 a3 a4
bb1 bb2 bb3 bb4
ccc1 ccc2 ccc3 ccc4
```

```bash
# 获取每行第一列内容
awk '{print $1}' a.txt

# 获取每行第一列，字符长度大于 2 的，只有第二和第三行的打印出来了。bb1,ccc1
awk 'length($1) > 2 {print $1}' a.txt
```

### sed-操作文本

也是一个比较厉害的操作文本的命令。可以用于替换文件中的内容，删除或新增内容，搜索符合条件的内容

```bash
# 将 a 替换为 ，
echo "a1b2c1" | sed s/a/,/g

# 比如我们在本地部署集群的时候，批量生成配置文件
sed s/6379/6380/g redis.conf > redis_6380.conf
```

### find-查询文件

```bash
# find  path  option ;

# 查询某个路径下的名称为 a.sh，这里会查出文件和目录
find / -name "a.sh"

# 指定查询 文件（f）或者目录(d)

find / -name "a.sh" -type f
```
