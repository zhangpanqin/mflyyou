---
title: SSH
---

## SSH 简介

Secure Shell Protocol，简称 SSH，是一种加密的网络传输协议，可在不安全的网络中为网络服务提供安全的传输环境。SSH 以非对称加密实现身份验证。

在类 Unix 系统中，已许可登录的公钥通常保存在用户 ~/.ssh/authorized_keys 文件中，该文件只由 SSH 使用。当远程机器持有公钥，而本地持有对应私钥时，登录过程不再需要手动输入密码。

## 免密码登录 Linux

:::tip
期望的结果，我只要输入 `ssh mflyyou` 连接我的服务器。
:::

1. 生成公私秘钥对

`.pub` 结尾是公钥

```shell
# -f 指定生成的位置，运行以下命令生成 私钥： ~/.ssh/id_rsa_mflyyou，公钥： ~/.ssh/id_rsa_mflyyou.pub
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_mflyyou
```

2. 将公钥复制到远程服务器

```shell
# ssh-copy-id -i {公钥绝对路径} {远程服务器用户名}@{远程服务器 ip}
ssh-copy-id -i ~/.ssh/id_rsa_mflyyou.pub parallels@10.211.55.8
```

以上命令作用是，将指定的公钥内容，拷贝到远程服务器上的指定用户`parallels`下。这样以后这个用户（parallels）就可以不用输入密码登录了。

运行上述命令将公钥内容拷贝到 /home/parallels/.ssh/authorized_keys。

3. 本地电脑配置私钥

在 `~/.ssh/config` 配置以下内容。

```
Host mflyyou
  HostName 10.211.55.8
  AddKeysToAgent yes
  UseKeychain yes
  User parallels
  IdentityFile ~/.ssh/id_rsa_mflyyou
```

4. 测试可以访问远程服务器

-   验证登录

```shell
# ssh -T 私钥文件 用户名@ip
ssh -T ~/.ssh/id_rsa_mflyyou parallels@10.211.55.8
```

-   或者验证是否持有远程服务器秘钥

```shell
ssh-keygen -F 10.211.55.8
```

以上配置结束，你可以 `ssh mflyyou` 登录远程服务器了。
