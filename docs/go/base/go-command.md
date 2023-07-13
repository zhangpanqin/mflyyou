---
title: Go 命令
---

## go env

1. `GOPATH`：Go 工作区的路径，用于存放源代码、第三方库和依赖项。
2. `GOROOT`：Go 安装的根目录。
3. `GOBIN`：Go 可执行文件的安装目录。
4. `GOCACHE`：编译缓存目录的路径。
5. `GOENV`：当前的 Go 环境。
6. `GORACE`：用于数据竞争检测的配置。
7. `GOPROXY`：用于模块下载的代理地址。
8. `GO111MODULE`：用于控制模块支持的开关。on：开启，off：关闭，auto 根据当前目录下是否有 go.mod 使用 go modules

以上值可以用系统环境变量修改，也可以 `go env -w` 去修改

```shell
# 查看 go 环境配置
go env

# 查看具体某个值
go env GO111MODULE

# 设置 go module 下载的代理，这个是官网的代理。有些 module 托管在 github，不翻墙下载不下来
go env -w  GOPROXY=https://goproxy.io,direct

# 临时修改
export GO111MODULE=auto

# 全局修改
go env -w GO111MODULE=auto
```

## go mod

```shell
# 初始化路径
go mod init test

# 检查依赖及下载依赖，会修改 go.mod
go mod tidy

# 打印依赖图
go mod graph

# 校验依赖
go mod verify

# 解释为什么需要依赖
go mod why
```

## go get

```shell
# 安装特定版本依赖包
go get github.com/aws/aws-sdk-go-v2/config@v1.18.23

# 不存在安装最新版，存在升级到最新版
go get github.com/aws/aws-sdk-go-v2/config
```
