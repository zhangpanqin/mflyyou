---
title: Nginx-性能优化
top: false
cover: false
toc: true
mathjax: true
date: 2020-04-12 16:57:24
password:
summary:
tags: Nginx
categories: Nginx
img: http://oss.mflyyou.cn/blog/20200328203106.png?author=zhangpanqin
---

## 前言

这篇关于 `Nginx` 的性能优化，是我查阅资料研究所成，并没有用于实际生产环境，<font color=red>如若你想用于实践，请谨慎测试之后使用。</font>

`Nginx` 性能优化，主要是减少`磁盘 io`。

- 请求头、请求体、响应体都在缓冲区操作。
- 文件信息的读取

减少网络 io。

- gzip 压缩。前端资源也可以提前进行 `gzip` 压缩，这样请求的时候就不用再压缩了，减少对 `cpu` 的损耗。
- 强缓存。减少对后端的静态资源的请求。

`http` 链接的尽快释放，减少请求的堆积。

`linux` 内核优化。这部分主要是查阅资料加上自己的理解。内容来自 《深入理解 Nginx 模块开发与架构设计》。



调账参数之后可以使用 `ab` 和 `jmeter` 进行压测，根据实际效果来进行调优。



`Nginx` 一定要在安全的情况下做性能优化。不然 tcp 攻击就能给你服务器搞挂了，能用才是王道。安全访问第一，性能第二。



调优之后，一定记得要做限流哦。



下个系列准备写 `Mysql` 相关，已经在做准备了。

## linux 内核优化

可以修改  `/etc/sysctl.conf` 来修改内核参数。<font color=red>这部分优化慎重</font>

- 查看 tcp 相关系统参数

```bash
 sysctl -a | grep 'net.ipv4.tcp' | grep -v grep
```

```properties
fs.file-max = 999999
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_keepalive_time = 15
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_max_tw_buckets = 5000
net.ipv4.ip_local_port_range = 1024 65000
net.ipv4.tcp_rmem = 4096 32768 262144
net.ipv4.tcp_wmem = 4096 32768 262144
net.ipv4.tcp_max_orphans = 262144 
net.core.netdev_max_backlog = 262144
net.core.rmem_default = 262144
net.core.wmem_default = 262144
net.core.rmem_max = 2097152
net.core.wmem_max = 2097152
net.core.somaxconn = 262144 
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog=262144
```

修改之后执行以下命令，使配置生效。

```bash
sysctl -p
```

上面的参数意义解释如下： 

- fs.file-max：999999

    >  这个参数表示进程（比如一个worker进程）可以同时打开的最大句柄数，这 个参数直接限制最大并发连接数，需根据实际情况配置。 

- net.ipv4.tcp_tw_reuse：

    > 这个参数设置为1，表示允许将TIME-WAIT状态的socket重新用于新的 TCP连接，这对于服务器来说很有意义，因为服务器上总会有大量TIME-WAIT状态的连接。 

- net.ipv4.tcp_keepalive_time：

    > 这个参数表示当keepalive启用时，TCP发送keepalive消息的频度。 默认是2小时，若将其设置得小一些，可以更快地清理无效的连接。 

- net.ipv4.tcp_fin_timeout：

    > 这个参数表示当服务器主动关闭连接时，socket保持在FIN-WAIT-2状态的最大时间。 

- net.ipv4.tcp_max_tw_buckets：

    > 这个参数表示操作系统允许TIME_WAIT套接字数量的最大值， 如果超过这个数字，TIME_WAIT套接字将立刻被清除并打印警告信息。该参数默认为 180000，过多的TIME_WAIT套接字会使Web服务器变慢。 

- net.ipv4.ip_local_port_range：

    > 这个参数定义了在UDP和TCP连接中本地（不包括连接的远端） 端口的取值范围。 

- net.ipv4.tcp_rmem：

    > 这个参数定义了TCP接收缓存（用于TCP接收滑动窗口）的最小 值、默认值、最大值。 

- net.ipv4.tcp_wmem：

    > 这个参数定义了TCP发送缓存（用于TCP发送滑动窗口）的最小 值、默认值、最大值。 

- net.ipv4.tcp_max_orphans

    > 选项用于记录那些尚未收到客户端确认信息的连接请求的最大值。对于有128MB内存的系统而言，此参数的默认值是1024，对小内存的系统则是128。

- net.core.netdev_max_backlog：

    > 当网卡接收数据包的速度大于内核处理的速度时，会有一个队列 保存这些数据包。这个参数表示该队列的最大值。 

- net.core.net.core.rmem_default：

    > 这个参数表示内核套接字接收缓存区默认的大小。 

- net.core.wmem_default：

    > 这个参数表示内核套接字发送缓存区默认的大小。

- net.core.rmem_max：

    > 这个参数表示内核套接字接收缓存区的最大大小。 

- net.core.wmem_max：

    > 这个参数表示内核套接字发送缓存区的最大大小。 

滑动窗口的大小与套接字缓存区会在一定程度上影响并发连接的数目。

每个 TCP连接都会为维护TCP滑动窗口而消耗内存，这个窗口会根据服务器的处理速度收缩或扩 张。

 参数wmem_max的设置，需要平衡物理内存的总大小、Nginx并发处理的最大连接数量 （由nginx.conf中的worker_processes和worker_connections参数决定）而确定。

当然，如果仅仅 为了提高并发量使服务器不出现Out Of Memory问题而去降低滑动窗口大小，那么并不合 适，因为滑动窗口过小会影响大数据量的传输速度。

rmem_default、wmem_default、 rmem_max、wmem_max这4个参数的设置需要根据我们的业务特性以及实际的硬件成本来综 合考虑。 

- net.core.somaxconn

    > 选项表示当每个网络接口接收数据包的速率比内核处理这些包的速率快时，允许发送到队列的数据包的最大数目。

- net.ipv4.tcp_syncookies：

    > 设置为 1。该参数与性能无关，用于解决TCP的SYN攻击。

- net.ipv4.tcp_max_syn_backlog：

    >  这个参数表示TCP三次握手建立阶段接收SYN请求队列的最大 长度，默认为1024，将其设置得大一些可以使出现Nginx繁忙来不及accept新连接的情况时， Linux不至于丢失客户端发起的连接请求。 



## 内存及磁盘资料优化

### client_header_buffer_size 1k;

> 作为静态资源访问 1k 足够了。
>
> 客户端请求头部的缓冲区大小，默认 1k，当请求接口的时候，根据请求头数据设置 4k 整数倍。
>
> 4k 为系统内存页大小，命令 getconf PAGESIZE 内存页大小

### large_client_header_buffers

![image-20200329190558284](http://oss.mflyyou.cn/blog/20200412191248.png?author=zhangpanqin)

### client_body_in_single_buffer

设置为 on，http 包一律写入到内存 buffer 中，如果包体超过  `client_body_buffer_size`  的大小，还是会写入到磁盘文件中。

### client_body_buffer_size

x64 默认 16K。定义接受请求体内存缓冲区大小，请求先写入到缓存区，超过在写入临时文件中。

### client_max_body_size 100m;

设置客户端请求体最大允许大小，默认 1m。检查的是 Content-Length。设置为 0 不检查。针对具体 location 配置。防止被请求攻击，在需要调大的地方设置，不要全局设置。

### sendflie on;

文件内容读取减少了内核态到用户态的拷贝，直接从内核态到网卡设备，提高了发送效率。

### open_file_cache 

缓存文件的存储信息。max 表示最大存储数量，超过这个数量，采用 LRU 淘汰

inactive 指定时间段，该时间段内没有被访问过的元素，会被淘汰

open_file_cache max=65535 inactive=20s;

### open_file_cache_min_uses

默认为 1。与 open_file_cache 的 inactive 配合使用，如果在 inactive 指定的时间内，访问次数超过 open_file_cache_min_uses 指定的次数，不会淘汰缓存。

### 调大文件句柄限制

`linux` 一切皆文件，但是进程打开的文件数会有限制。可针对用户和进程来限制文件句柄数。

- 文件句柄，可以针对用户，进程设置

    - 全局设置 /etc/security/limits.conf

```nginx
* hard nofile 65535
* soft nofile 65535
root hard nofile 65535
```

    - nginx 进程配置

```nginx
worker_rlimit_nofile 20480;
```

## 日志优化

可适当减少日志操作。比如访问静态资料的日志记录，如果你感觉不重要，可以取消日志记录。这样请求资源的时候就会减少日志的磁盘 io。

```nginx
# 关闭日志
access_log off;
# 禁用文件未找到的错误到日志中去
log_not_found off;
```

### 反向代理优化

如果你用 `nginx` 作为代理服务器，也要减少磁盘 io 的读取。

```nginx
proxy_buffering on;
proxy_buffer_size 4k;
proxy_buffers 16 64k;
proxy_busy_buffers_size 128k;
proxy_temp_file_write_size 128k;
proxy_set_header Host $http_host;
proxy_set_header X-REAL-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## Nginx 优化配置

```nginx
# 配置 worker 进程所属用户,用户组
user nginx nginx;

# 配置 worker 进程数量，为避免 cpu 切换损耗，配置和系统内核数一样即可,或者 auto
worker_processes auto;

# 配置 cpu 亲和,auto 代表自动绑定
worker_cpu_affinity auto;

# nginx 进程打开文件描述符数目，此值覆盖 ulimit -n 的值。
worker_rlimit_nofile 65535;

events {
    # 用这个模型来高效处理异步事件
    use epoll;

    # 设置为 on worker 进程轮流接受新链接,官方推荐设置为 off.高负载的情况下设置为 on.
    accept_mutex on;

    # worker进程是否同时接受连接所有新请求。默认为off，表示一次只接受一个新的请求。官方推荐 off
    multi_accept on;

    # 配置 一个 woker 进程处理的连接数
    worker_connections 65535;
}
http {
    # 关闭日志
    access_log off;
    # 隐藏响应头中的有关操作系统和web server（Nginx）版本号的信息，这样对于安全性是有好处的。
    server_tokens off;
    sendfile on;
    # 设置为非零值时，可限制单个 sendfile() 调用时传输的数据量。如果没有限制，一个快速 连接可能会完全占用工作进程。
    sendfile_max_chunk 5m;
    # tcp_nopush 和 tcp_nodeny 可以一起生效
    # 等数据包累计到一定大小发送，启用 sendfile 生效
    tcp_nopush on;
    # 该选项仅在连接转换到 keep-alive ，长连接状态时启用。让 tcp 尽快发包。
    tcp_nodelay on;
    # 为了尽快释放连接,可以设置小点. 15 至 30
    keepalive_timeout 15;

    # 客户端请求头部的缓冲区大小，默认 1k，当请求接口的时候需要设置 4k 整数倍.内存设置为系统内存页大小，命令 getconf PAGESIZE 内存页大小
    client_header_buffer_size 4k;

    large_client_header_buffers 8 8k;

    # 根据需求设置,接口请求可以设置大些
    client_body_buffer_size 128k;

    # 设置客户端请求体最大允许大小，默认 1m。检查的是 Content-Length。设置为 0 不检查。针对具体 location 配置
    client_max_body_size 1m;


    # 下面这个参数将为打开文件指定缓存，默认是没有启用的，max指定缓存数量，建议和打开文件数一致，
    # inactive是指经过多长时间文件没被请求后删除缓存。
    open_file_cache max=262140 inactive=20s;
    # 下面这个是指多长时间检查一次缓存的有效信息。
    open_file_cache_valid 30s;
    # open_file_cache指令中的inactive参数时间内文件的最少访问次数，低于这个数,缓存清除
    open_file_cache_min_uses 1;
    open_file_cache_errors on;

    reset_timedout_connection on;
    client_body_timeout 10;
    send_timeout 2;

    # 限制每个 ip 的连接数
    limit_conn_zone $binary_remote_addr zone=conn_limit_per_ip:10m;

    # 限制每个 ip 每秒的请求数
    limit_req_zone $binary_remote_addr zone=req_limit_per_ip:10m rate=10r/s;

    gzip on;
    # 在响应头中增加，Vary: Accept-Encoding
    gzip_vary on;
    # gzip压缩级别1-9，数字越大压缩效果越好，压缩时间也就越长CPU越高
    gzip_comp_level 5;
    # 申请内存时大小，如果源文件 9k，超过了 8K，那会申请 16*8K。
    gzip_buffers 8 128k;
    gzip_min_length 5K;
    gzip_proxied any;
    gzip_disable msie6;
    gzip_http_version 1.1;
    # 文本（js、text、css、xml、json）压缩比较好，图片已经进行过压缩，在压缩，效果不是很明显，还浪费 cpu
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss application/rss+xml application/atom+xml image/svg+xml;

    # 安全相关 header
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Feature-Policy "autoplay 'none'; camera 'none'" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;


    server {
        listen 80 backlog=262144;

        limit_conn conn_limit_per_ip 10;
        limit_req zone=req_limit_per_ip burst=10 nodelay;
        # assets, media
        location ~* \.(?:css(\.map)?|js(\.map)?|jpe?g|png|gif|ico|cur|heic|webp|tiff?|mp3|m4a|aac|ogg|midi?|wav|mp4|mov|webm|mpe?g|avi|ogv|flv|wmv)$ {
            # 强缓存，时间为一年，浏览器和 cdn 中间件可以缓存
            add_header Cache-Control "max-age=31536000";
            etag off;
            access_log off;
            # 禁用文件未找到的错误到日志中去
            log_not_found off;
        }

        # svg, fonts
        location ~* \.(?:svgz?|ttf|ttc|otf|eot|woff2?)$ {
            # 强缓存，时间为一年，浏览器和 cdn 中间件可以缓存
            add_header Cache-Control "max-age=31536000";
            etag off;
            access_log off;
            # 禁用文件未找到的错误到日志中去
            log_not_found off;
        }
    }

}
```

## 资料参考

[http-security-headers](https://www.keycdn.com/blog/http-security-headers)

[Nginx Performance Tuning – Tips & Tricks](https://www.nginx.com/blog/performance-tuning-tips-tricks/)

《深入理解 Nginx 模块开发与架构设计》。