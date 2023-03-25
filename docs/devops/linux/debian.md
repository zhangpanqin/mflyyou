---
title: Debian
---

Debian 11 的代号是 bullseye。

## 软件包管理器

`dpkg` 是一个更底层的包管理器。

`apt` 和 `apt-get` 是一个更贴近用户更友好的包管理，不过它俩的底层是 dpkg。

debian 官方文件有一句话

```shell
Users are recommended to use the new apt(8) command for interactive usage and use the apt-get(8) and apt-cache(8) commands in the shell script.
```

意思就是我们在写脚本的时候还是使用 apt-get，terminal 中使用用 apt。

所以我们在 docker 官方 image dockerfile 中看到的都是使用 `apt-get`



### 命令

从 `/etc/apt/source.list` 配置的连接读取包的更新信息。

debian 11 的配置。

```
deb http://deb.debian.org/debian bullseye main
deb http://deb.debian.org/debian-security bullseye-security main
deb http://deb.debian.org/debian bullseye-updates main
```



apt update  会更新包索引库及下载软件包，因此我们在 docker image 中安装软件之后会删除

`rm -rf /var/lib/apt/lists/*`



```shell
# 列出已安装的包。
apt list --installed

# 列出需要升级的
apt list --upgradeable

# 更新存储库索引及下载包
apt update 

# 安装软件包。
apt install -y curl

# 卸载安装的软件。
apt remove nginx

# 搜索某个软件在那个包
apt install apt-file
apt-file update
# 正则搜寻
apt-file search -x '/bin/ss$'
# list 某个包文件
apt-file list iproute2
# 查看执行文件
apt-file list iproute2 | grep bin
```

