---
title: Nginx-包教包会-入门
---

## 前言

`Nginx` 作为 `web 服务器` 以低内存，高扩展，并且轻松单机支持 `1-3w` （据说可以单机 10w，但没有看到具体的机器配置）的并发链接的特性广受开发人员的青睐。

推荐在 `linux` 系统上使用 `Nginx` ，这会充分利用 `linux` 的特性，性能比在 `windows` 上会更好。

本文主要内容：

-   Nginx 简单配置
-   root 和 alias 的区别
-   location 的优先级及验证
-   Nginx 内置变量介绍
-   if
-   rewrite 转发
-   try_files
-   配置 gzip
-   协商缓存和强缓存的介绍和配置

后续章节，我会使用 `ab` 压测来一步一步优化 `Nginx` 的配置，Nginx 知道原理，懂得常用配置即可。有的性能优化需要了解 `linux 内核` 、`http`、`tcp` 相关的东西，如果你不想了解，可以记录一份自己的配置即可，不必纠结为什么。

本文内容在 `nginx 1.16.1` 上测试，`Centos 7` 4 核 8g 内存的虚拟机。

## Nginx 安装

### docker 

```shell
docker pull nginx:1.25.0-alpine3.17-slim
mkdir -p ~/docker-nginx/html && mkdir -p ~/docker-nginx/nginx/conf.d


docker run -it --name mflyyou-nginx \
nginx:1.25.0-alpine3.17-slim

docker cp mflyyou-nginx:/etc/nginx/conf.d/default.conf ~/docker-nginx/nginx/conf.d/default.conf
docker cp mflyyou-nginx:/etc/nginx/nginx.conf ~/docker-nginx/nginx/nginx.conf
docker cp mflyyou-nginx:/usr/share/nginx/html ~/docker-nginx/

docker container stop mflyyou-nginx
docker container rm mflyyou-nginx


docker run -it -d --name mflyyou-nginx -p 80:80 \
-v ~/docker-nginx/nginx/conf.d/default.conf:/etc/nginx/conf.d/default.conf \
-v ~/docker-nginx/nginx/nginx.conf:/etc/nginx/nginx.conf \
-v ~/docker-nginx/html:/usr/share/nginx/html \
nginx:1.25.0-alpine3.17-slim


docker exec -it mflyyou-nginx sh
```





### Nginx 安装步骤

根据 [阿里 CentOS 镜像](https://developer.aliyun.com/mirror/centos) 配置 `yum` 源，提高下载速度。

[阿里 epel 镜像](https://developer.aliyun.com/mirror/epel) 配置我们常用软件的包，`Nginx` 也在其中。

```bash
# 运行一下命令，更新 yum 源
yum clean all
yum makecache
```

刷新 `yum` 仓库信息之后，运行以下命令就可以找到 `nginx`

```bash
yum list | grep nginx
```

安装 `nginx`

```bash
sudo yum install nginx
```

配置 `nginx` 开机启动

```bash
sudo systemctl enable nginx
```

启动 `nginx`

```bash
sudo systemctl start nginx
```

检查 `nginx` 是否启动

```bash
sudo systemctl status nginx
```

![image-20200327220547818](/blog/20200327220547.png?author=zhangpanqin)

如果想查看 `nginx`包都安装了哪些文件，可以使用

```bash
rpm -qvl nginx
```

![image-20200327221058643](/blog/20200327221058.png?author=zhangpanqin)

### Nginx 命令

```bash
# 强制立即关闭，不建议做
nginx -s stop

# 正常关闭，会处理已经接到的请求，但不会接受新的请求
nginx -s quit

# 重新加载配置文件
nginx -s reload

#  重新打开日志文件
nginx -s reopen

# 检查配置文件是否有误
nginx -t

# 检查配置文件是否有误，会将配置文件内容打印
nginx -T

# 查看 nginx 版本
nginx -v

# 查看 nginx 版本和编译配置致残
nginx -V
```

### 系统开启、关闭、重启、查看 nginx 命令

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl restart nginx
sudo systemctl stop nginx
sudo systemctl status nginx
```

## Nginx 简单配置

### Nginx 介绍

部署的 `Nginx` 使用一个 `master` 进程管理多个 `worker` 进程。`master` 进程不处理请求，提供管理服务，包括启动、停止、重载配置文件等服务，通常以 `root` 用户启动， `worker` 进程进行请求的处理，一般用非管理员账户启用，`worker` 进程数量和 cpu 核心设置一直，降低进程切换带来的 `cpu` 切换。

![image-20200327222127446](/blog/20200327222127.png?author=zhangpanqin)

`http` 上下文中的配置是我们重点需要知道的，其余的了解会配置即可。

### Server 配置

```nginx
http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    server {
        listen 80 ;
        server_name _;
        root /usr/share/nginx/html;
        location / {
        }
    }
}
```

`Server` 既配置一个服务。

`listen 80` 用于配置监听 `80` 端口的服务。

`root` 指定静态资源存放的位置。

location 进行资源匹配。`location / {}` 匹配所有的资源。

### `listen` 和 `server_name` 配置

匹配规则：

-   先匹配 `listen` 再匹配 `server_name`
-   `server_name` 匹配请求头中的 `Host`
-   当都没有匹配成功，由配置`default_server` 的处理
-   以上都没有匹配成功，由第一个配置处理

```nginx
server {
    listen 9099 default_server;
    server_name "localhost";

    location / {
        return 200 "server_name 为 localhost";
    }
}
server {
    listen 9099;
    server_name 127.0.0.1;

    location / {
    	return 200 "server_name 为 127.0.0.1";
    }
}
server {
    listen 9099;
    server_name "localhost77";

    location / {
    	return 200 "server_name 为 localhost77";
    }
}
```

在 `Postman`中设置请求头 `Host` 模拟访问。

`http://localhost:9099` Host:`127.0.0.1` 返回 `server_name 为 127.0.0.1`

`http://localhost:9099` Host:`localhost` 返回 `server_name 为 localhost`

`http://localhost:9099` Host:`localhost77` 返回 `server_name 为 localhost77`

`http://localhost:9099` Host:`localhost779` 返回 `server_name 为 localhost`

再添加一个配置

```nginx
server {
    listen localhost:9099 default_server;
    server_name "localhost";

    location / {
        return 200 "server_name 为 localhost:9099";
    }
}
```

当 `listen` 访问 `localhost:9099` 的时候，返回 `server_name 为 localhost:9099` ，因为只有这一个匹配上了。

如果想禁止没有 `Host` 请求头的访问。

```nginx
server {
    listen      80;
    server_name "";
    # 表示 nginx 会关闭连接
    return 444;
}
```

### `return` 配置

`return` 用于定义返回的状态码，或者内容。

介绍 `return` 主要是为了好描述 `location` 配置

| -      | 说明                                                      |
| ------ | --------------------------------------------------------- |
| 语法   | return code [text];<br/>return code URL;<br/>return URL ; |
| 默认   | -                                                         |
| 上下文 | server、location、if                                      |

`code` 为状态码。`text` 为字符串。

```nginx
location /a {
    default_type application/json;
    return 200 "访问 9088/a";
}
```

```nginx
# 重定向
location = /b {
    return 301 http://www.baidu.com;
}
```

### `location` 配置

`location` 用于匹配资源。

<font color=red>数字越小，优先级越高。</font>

| 规则符号            | 描述                                                                  | 优先级 |
| ------------------- | --------------------------------------------------------------------- | ------ |
| location `=` /a{}   | 精准完全匹配，匹配到之后                                              | 1      |
| location `^~` /a{}  | 前缀匹配，匹配到之后                                                  | 2      |
| location ~ /a\.\*{} | 正则匹配，区分大小写，检查到之后，还会检查有没有优先级跟高的          | 3      |
| location ~_ /a\._   | 正则匹配，不区分字母大小写，检查到之后，还会检查有没有优先级跟高的    | 4      |
| location /a {}      | 也表示前缀匹配，但是优先级低于 正则匹配。 `/a` 和 `^~/a` 会冲突，报错 | 5      |
| location / {}       | 任何没有匹配成功的，都会匹配这里处理                                  | 6      |

```nginx
server {
        listen 9088 default_server;
        server_name _ ;

        location = /a {
            default_type application/json;
            return 200 "= /a,优先级第一";
        }
        location ^~ /a {
            default_type application/json;
            return 200 "^~ /a 匹配 /a 开头的路径,优先级第二";
        }

        location ~ /a\.* {
            default_type application/json;
            return 200 " /a\.* 匹配 /a...路径,优先级第三";
        }
        location ~* /a\.* {
            default_type application/json;
            return 200 "~* /a\.* 匹配 /a...路径,优先级第四";
        }
    	# /a 会和 ^~ /a 冲突
        location /a/ {
            default_type application/json;
            return 200 "/a/ 匹配 /a/...路径,优先级第五";
        }
    }
```

访问 `http://localhost:9088/a` ，依次注释优先级较高的，可以验证这个规律。

还有一类特殊的 `location` 用于配置跳转的，以 `@` 开头

```nginx
location @pass {

}
```

### add_header 添加响应头

| -      | 说明                                     |
| ------ | ---------------------------------------- |
| 语法   | add_header name value [always];          |
| 默认   | -                                        |
| 上下文 | http、server、location、location 中的 if |

如果响应代码等于 200、201、204、206、301、302、303、304、307 或 308，则将指定的字段添加到响应报头中。

加上 `always` 不管什么状态码都加上。

```nginx
location ~ /a\.* {
    default_type application/json;
    add_header test1 "asdfasdf" always;
    return 200 " /a\.* 匹配 /a...路径,优先级第三";
}
```

### error_page

| -      | 说明                                       |
| ------ | ------------------------------------------ |
| 语法   | `error_page code …[=[response code]] uri;` |
| 默认   | -                                          |
| 上下文 | http、server、location、location 中的 if   |

配置错误状态码跳转页面。

```nginx
error_page 404 /404.html;
error_page 500 502 503 504 /50x.html;
```

以上不会改变响应状态码。

```nginx
# 改变响应状态吗。
error_page 404 =200 /404.html;
```

```nginx
server {
    location / {
       error_page 404 =  @ops-coffee;
    }

    location @ops-coffee {
       rewrite  .*  / permanent;
    }
}
```

## root 和 alias 的区别

`alias` 理解为：路径替换，location 以 `/` 结尾，alias 必须以 `/` 结尾。严格匹配。`alias` 替换掉 `location` 路径。

```nginx
# /bieming/     替换  /usr/local/var/www/alias2/
# 访问 /bieming/1.jpg 去寻找 /usr/local/var/www/alias2/1.jpg
location /bieming/ {
    alias /usr/local/var/www/alias2/;
}
```

`root` 理解为：root 路径加上 + `location` 路径。会将两个或更多个 `/` 压缩成一个。

```nginx
# 当 location 和 root 路径的最后一部分匹配时，更好的方式是使用 root
## 以下配置都可以。
# 访问 /data2/1.jpg   去寻找  /usr/local/var/www/data2/1.jpg
location /data2/ {
    root /usr/local/var/www;
}
location /data2/ {
    root /usr/local/var/www/;
}
location /data2 {
    root /usr/local/var/www;
}
location /data2 {
    root /usr/local/var/www/;
}
location /data2/ {
    root /usr/local/var/www////;
}
```

## 内置变量

通过内置变量，我们可以通过判断请求头、`query string` 等值来转发或者拒绝访问。

### `$arg_name` 获取请求参数

获取请求`query string` 中的 `name` 参数。

```nginx
location /arg/ {
    default_type application/json;
    return 200 "$arg_q1";
}
```

`/arg/a?q1=334` 返回的内容为 `334`。

### `$args` 获取请求 `query_string` 参数

```nginx
location /arg/ {
    default_type application/json;
    return 200 "$arg_q1 _ $args";
}
```

浏览器访问 `/arg/a?q1=3334&aa=2&bb=33` 返回的内容为 `3334 _ q1=3334&aa=2&bb=33`

### `$cookie_name` 获取 cookie 的值

获取请求中的名称为 `name` 的 cookie。

### `$http_name` 获取请求头

`name` 为请求头中的字段名称，请求头名称全部小写，并将破折号`-` 替换为下划线 `_`

`$http_user_agent` 获取请求头中的 `User-Agent` 字段。

### `$uri` 获取请求路径中的 `path`

`path` 为端口后面的路径，不包括 `query string`。优化之后的路径，特殊字符转译及 `/` 压缩。

`http://localhost:8888/arg/a?q1=q1canshu&bb=2323` 中的 `path` 为 `/arg/a`

### `$host` 获取请求的 `ip`

首先会获取请求头 `Host` ，如果没有请求头中没有 `Host` 请求头，那么获取的是 `url` 中的 `ip`。

### `$request_uri` 获取 `path` 和 `query string`

访问 `http://localhost:8888/arg/a/?q1=q1canshu&bb=2323`

`$request_uri` 为`/arg/a/?q1=q1canshu&bb=2323`

### `$scheme` 获取请求协议

值为 `http` 或 `https`

### `$request_method` 获取请求方法

获得的值字母全大写。GET,POST,DELETE,PUT 等

### 其他变量

| -                 | 描述                                              |
| ----------------- | ------------------------------------------------- |
| `$content_length` | 获取 `Content-Length` 请求头字段。                |
| `$content_type`   | 获取 `Content-Type` 请求头字段                    |
| `$https`          | 如果连接以 SSL 模式运行，则为 on ，否则为空字符串 |
| `$is_args`        | 如果请求行有参数则为 ? ，否则为空字符串           |
| `$pid`            | 获取处理当前请求的 `worker` pid                   |
| `$nginx_version`  | 获取 nginx 的版本                                 |
|                   |                                                   |

## if

| -      | 说明               |
| ------ | ------------------ |
| 语法   | if (`condition`){} |
| 默认   | -                  |
| 上下文 | server、location   |

指定的 condition 求值之后，如果为 true ，则执行在大括号内指定的该模块的指令，并在 if 指令内为该请求分配配置。 if 指令内的配置继承自上一层的配置级别。

condition 可以是以下任何一种:

-   变量名，如果变量的值为空字符串或 0 ，则为 false
-   使用 = 和 != 运算符比较变量和字符串

-   使用 ~ (区分大小写的匹配)和 ~\* (不区分大小写的匹配)运算符，变量将与正则表达式进行匹配。正则表达式可以包含可供以后在 `$1`..`$9` 变量中重用的捕获。
-   反操作符 !~ 和 !~\* 也可用。如果正则表达式包含 } 或 ; 字符，则整个表达式应使用单引号 或双引号包围起来。

-   使用 -f 和 !-f 运算符检查文件是否存在
-   使用 -d 和 !-d 运算符检查目录是否存在
-   使用 -e 和 !-e 运算符检查文件、目录或符号链接是否存在
-   使用 -x 和 !-x 运算符检查是否为可执行文件

<font color=red>`if` 与小括号之间需要有空格</font>

```nginx
location = /a {
    default_type application/json;
    if ($request_uri ~* "/(a).*") {
        return 200 "正则表达式捕获的值:$1";
    }
    return 200 "= /a,优先级第一";
}
```

## rewrite

| -      | 说明                              |
| ------ | --------------------------------- |
| 语法   | rewrite regex replacement [flag]; |
| 默认   | -                                 |
| 上下文 | server、location、if              |

`flag` 可选参数：

-   last

停止匹配，发送一个新的请求去匹配 `location`。

-   break

停止匹配，在当前 `location` 去搜索资源。

-   redirect

临时重定向。返回状态码 `302`。

-   permanent

永久重定向。返回状态码 `301` 。

指定的 `regex` 能匹配，uri 将根据 `replacement` 来处理。

### 验证 break 和 last

以下三张图片都存在，但是内容不一样。

/Users/zhangpanqin/stduy_app/break2/test/1.jpg

/Users/zhangpanqin/stduy_app/last2/test/1.jpg

/Users/zhangpanqin/stduy_app/test/1.jpg

```nginx
location /break2 {
    root /Users/zhangpanqin/stduy_app/break2;
    rewrite /break2/(.*) /test/$1 break;
}

location /last2 {
    root /Users/zhangpanqin/stduy_app/last2;
    rewrite /last2/(.*) /test/$1 last;
}

location /test/ {
    root /Users/zhangpanqin/stduy_app;
}
```

当访问 `/break2/1.jpg` 实际匹配第一个 `location`，然后在当前上下文处理 。

`/break2/1.jpg` 被替换为 `/test/1.jpg` 来处理了，然后和 `root` 指定的路径相结合，返回 `/Users/zhangpanqin/stduy_app/break2/test/1.jpg` 数据。

当访问 `/last2/1.jpg` ,uri 被替换为 `/test/1.jpg` 去匹配新的 location 进行处理。

返回 `/Users/zhangpanqin/stduy_app/test/1.jpg` 的内容。

### 验证 `redirect` 和 `permanent`

```nginx
location /redirect2 {
    rewrite ^/redirect2 http://www.baidu.com redirect;
}

location /permanent2 {
    rewrite ^/permanent2 http://www.baidu.com permanent;
}
```

二者匹配成功之后，都会改变浏览器地址栏地址。浏览器根据响应头 `Location` 跳转对应地址。

二者的区别在于，永久重定向 （`permanent`），浏览器会保存记录，当再访问 `http://localhost:9088/permanent2` 而不会询问 `nginx` 直接跳转。

临时重定向，浏览器每次都要询问 `nginx` 需要跳转到哪里。可以关闭 `nginx` 就知道验证结果了。

![image-20200328181255172](/blog/20200328181255.png?author=zhangpanqin)

## try_files

| -      | 说明                                                  |
| ------ | ----------------------------------------------------- |
| 语法   | try_files `file … uri;`<br/>try_files `file … =code`; |
| 默认   | -                                                     |
| 上下文 | server、location                                      |

以指定顺序检查文件是否存在，并使用第一个找到的文件进行请求处理。如果找不到内容内部转发到最后一个参数 `uri` 。文件位置为 `root` + `file`。

```nginx
location /try/ {
    root /usr/local/var/www/data2/data2/;
    try_files $uri $uri/ @pass2;
}
location @pass2 {
    default_type application/json ;
    return 200 "没到到页面代理的数据" ;
}
```

访问 `/try/1.jpg` 时，`$uri` 为 `/try/1.jpg` 。

`root` + `$uri` 为 `/usr/local/var/www/data2/data2/try/1.jpg` 找到返回，没有找到继续匹配返回。都没有匹配内部转发至 `@pass2`。

如想验证跳转使用 `/try/test` 之类的，不要使用后缀名，因为使用后缀名的话，浏览器会返回` content-type`，导致内容与解析不一致，图片出不来。

## 配置 gzip

```nginx
# 开启 gzip
gzip on;

# 在响应头中增加，Vary: Accept-Encoding
gzip_vary on;

# gzip压缩级别1-9，数字越大压缩效果越好，压缩所用时间也就越长，占用CPU越高
gzip_comp_level 6;

# 申请内存时大小，如果源文件 9k，超过了 8K，那会申请 16*8K。
gzip_buffers 16 8k;

gzip_min_length 2K;
gzip_proxied any;
gzip_disable "msie6";

gzip_http_version 1.1;

# 文本（js、text、css、xml、json）压缩比较好，图片已经进行过压缩，在压缩，效果不是很明显，还浪费 cpu
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss application/rss+xml application/atom+xml image/svg+xml;

```

gzip 压缩对文本效果比较好，推荐只对文本之类的压缩。

## 配置缓存

为了减轻服务器压力，节省带宽，可以配置缓存。

![image-20200328185715962](/blog/20200328185716.png?author=zhangpanqin)

`memory cache`:它是将资源文件缓存到内存中，缓存有效直接从内存加载。

`disk cache`: 它是将资源文件缓存到硬盘中，缓存有效直接从硬盘中加载。

先从 `memory cache` 找，找不到从 `disk cache` 找，再找不到，请求网络资源。

缓存分为 `协商缓存` 和 `强缓存`。

`协商缓存` 每次都要去服务器询问缓存是否过期，没有过期使用本地的缓存。

`强缓存` 会有缓存过期时间，在有效期内不会去服务端校验缓存，直接使用本地缓存。

现在的 `webpack` 可以根据文件内容的 `hash` 生产类似 `app.asdfa21342.js` 这样的文件。其实就是想使用强缓存，当网站更新，新的页面会解析加载不一样的资源，从而降低缓存校验对服务器性能的损耗。

### 协商缓存

协商缓存有：`ETag/if-None-Match` 和 `Last-Modified/if-Modify-Since` 两种。

http 协议规定，当这两种响应头都存在的时候，必须都要满足，才能使用缓存。

#### `ETag/if-None-Match`

| -      | 说明                   |
| ------ | ---------------------- |
| 语法   | etag on\|off;          |
| 默认   | etag on;               |
| 上下文 | http、server、location |

`nginx` 有个 etag 配置属性，会给每个静态资源生成 `Etag` 响应头，值为文件内容 `hash`。

当浏览器第一次访问资源的时候，返回的响应头中携带 `Etag` 。

后续的正常访问（不强制刷新缓存）相同的资源，都会带上请求头 `if-None-Match` ,值为 `Etag` 去 `nginx` 校验是否一样，一样说明缓存没有过期，返回状态码 `304`，直接访问浏览器中的缓存，否则从浏览器返回资源，返回状态码 200。

### `Last-Modified/if-Modify-Since`

| -      | 说明                                  |
| ------ | ------------------------------------- |
| 语法   | if_modified_since off\|exact\|before; |
| 默认   | if_modified_since exact；             |
| 上下文 | http、server、location                |

指定如何比较文件的修改时间与请求头 **If-Modified-Since** 进行比较:

-   off

忽略 **If-Modified-Since** 请求头字段(0.7.34)

-   exact

完全匹配

-   before

资源的修改时间小于或等于 **If-Modified-Since** 请求头字段中的时间

浏览器第一次访问一个资源的时候，响应头 `Last-Modified` 返回，标识文件的最后修改时间。

当浏览器再次正常访问（不强制刷新资源）相同资源，请求头会加上 `If-Modified-Since`，该值为之前返回的 `Last-Modified` 。`nginx` 收到 `If-Modified-Since` 后，根据配置 `if_modified_since` 属性比较资源的最后修改时间(`Last-Modified`)和该值`If-Modified-Since`进行比较，匹配成功，则命中缓存，返回 304，否则返回 资源，状态码为 200，并更新缓存时间。

### 强制缓存

#### Expires

`Expires` 是 `http1.0` 的规范，它的值是一个绝对时间的 GMT 格式的时间字符串。这个时间代表的该资源的失效时间，如果在该时间之前请求的话，则都是从缓存里面读取的。如果服务端和客户端时区不一致会导致判断不准确。

#### Cache-Control

`Cache-Control` 是 `http1.1` 的规范，它是利用该字段 `max-age` 值进行判断的。该值是一个相对时间，比如 `Cache-Control: max-age=3600` 代表该资源的有效期是 3600 秒。除了该字段外，我们还有如下字段可以设置：

**no-cache:** 需要进行协商缓存，发送请求到服务器确认是否使用缓存。

**no-store：**禁止使用缓存，每一次都要重新请求数据。

**public：**可以被所有的用户缓存，包括终端用户和 CDN 等中间代理服务器。

**private：**只能被终端用户的浏览器缓存，不允许 CDN 等中继缓存服务器对其缓存。

### 配置缓存

```nginx
location ~* \.(css|js|png|jpg|jpeg|gif|gz|svg|mp4|mp3|ogg|ogv|webm|htc|xml|woff)$ {
    # 关闭访问日志记录
    access_log off;
    # 强缓存，时间为一年，浏览器和 cdn 中间件可以缓存
    add_header Cache-Control "max-age=31536000";
}
```

## 推荐资料

[nginx 中文翻译](https://github.com/DocsHome/nginx-docs)
