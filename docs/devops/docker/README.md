# Docker

由于 [Docker Desktop](https://www.docker.com/products/docker-desktop/) 商业使用收费了，因此不能只将安装这个了。

为了简便构建开发环境，还是需要 docker 的，所以用 [colima](https://github.com/abiosoft/colima) 代替。

我们所说的 docker 实际上包含 command line interface client（docker），docker server（dockerd），docker compose 等相关组件。

写 dockerfile 还是简单一些的，遇到复杂得再研究即可。

[Dockerfile reference](https://docs.docker.com/engine/reference/builder/)

## colima

可以在本地运行 docker 命令。

```shelldocker build . -t vue-demo:0.0.1
colima start
colima stop
```

## docker command

```shell
# 构建 image
docker build . -t vue-demo:0.0.1
# 有的时候想看看 image 有什么文件。4bd0f9394726 是 image 的 id
docker run -it --entrypoint sh 4bd0f9394726
docker run -it --entrypoint sh vue-demo:0.0.1
# 查看 image 信息
docker inspect 4bd0f9394726
```

## 镜像介绍

随波逐流选镜像，我看好多官方镜像都是以 `debian:bullseye-slim` 作为基础镜像。

`bullseye` 是 debian 11 的代号。slim 是最小镜像。

## 多阶段构建

```dockerfile
# Start by building the application.
FROM golang:1.18 as build

WORKDIR /go/src/app
COPY . .

RUN go mod download
RUN CGO_ENABLED=0 go build -o /go/bin/app

# Now copy it into our base image.
FROM gcr.io/distroless/static-debian11
COPY --from=build /go/bin/app /
CMD ["/app"]
```

第一阶段构建，第二阶段只是打包最终运行的程序。比如 java 构建的时候需要 gradle 什么的，我只把 jar 包最终放到 docker image 中。

## 基础镜像选择

### Google distroless image

[google distroless github](https://github.com/GoogleContainerTools/distroless)

[google distroless Container Registry ](https://console.cloud.google.com/gcr/images/distroless/GLOBAL)

java ，node，go，python 等等都提供了镜像支持。而且考虑安全和最小体积。

比如说 java17-debian11 它只能够运行 java 程序，而没有包含 shell 环境和软件包管理。

第一优先级我会选择 google 的镜像。

:::tip

Distroless images contain only your application and its runtime dependencies.

They do not contain package managers, shells or any other programs you would expect to find in a standard Linux distribution.

:::

### 该不该选择 alpine 做为基础镜像？

我们选择 alpine 的原因是它更小。

alpine 它本来是用于嵌入式系统中的，应用于服务领域可能不太好。

[Alpine Linux](https://alpinelinux.org/) is a Linux distribution built around [musl libc](https://www.musl-libc.org/) and [BusyBox](https://www.busybox.net/).

musl-libc 和 glibc 是 c 语言标准库的不同实现。glibc 兼容性更好，musl-libc 优点是小也是为了嵌入式开发。

为了部署应用建议选择 glibc，因为好多语言都是基于 glibc 编译构建的，兼容性更好。

建议后端部署，还是选择 google distroless 吧。

## ENTRYPOINT 和 CMD

`ENTRYPOINT` 的格式和 `RUN` 指令格式一样，分为 `exec` 格式和 `shell` 格式。

`ENTRYPOINT` 的目的和 `CMD` 一样，都是在指定容器启动程序及参数。`ENTRYPOINT` 在运行时也可以替代，不过比 `CMD` 要略显繁琐，需要通过 `docker run` 的参数 `--entrypoint` 来指定。

:::tip

当指定了 `ENTRYPOINT` 后，`CMD` 的含义就发生了改变，不再是直接的运行其命令，

而是将 `CMD` 的内容作为参数传给 `ENTRYPOINT` 指令，换句话说实际执行时，将变为：<ENTRYPOINT> <CMD>

:::

那么有了 `CMD` 后，为什么还要有 `ENTRYPOINT` 呢？这种 `<ENTRYPOINT> "<CMD>"` 有什么好处么？让我们来看几个场景。

`ENTRYPOINT` + `CMD` = 默认容器命令参数

推荐指定 `ENTRYPOINT` , 然后通过 cmd 来追加参数

```dockerfile
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
```
