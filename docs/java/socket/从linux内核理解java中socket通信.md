---
title: 从linux内核理解Java怎样实现Socket通信
---

## 前言

前段时间买本书研究了 `TCP/IP` 通信，弄清楚了计算机之间是怎么通信的。网络通信的的基础就是 `TCP/IP 协议簇`，也被称为 `TCP/IP 协议栈` ，也被简称为 `TCP/IP 协议`。 `TCP/IP 协议` 并不是只有 `TCP` 和 `IP` 协议，只是这俩用的比较多，就用这两个起的名字。

我们目前使用的 `HTTP` , `FTP` , `SMTP` , `DNS` , `HTTPS` , `SSH` , `MQTT` , `RPC` 等都是以 `TCP/IP协议` 为基础。下图针对的是 `传输层为 TCP` 。

<img src="http://oss.mflyyou.cn/blog/20200718221518.svg?author=zhangpanqin" alt="TCP_IP 同一以太网 (1)" style="zoom:50%;" />

`Linux 内核` 为我们屏蔽了 `TCP/IP` 通信模型的复杂性，并且 Linux 中一切皆文件，因此为我们抽象了 `Socket` 文件，实际我们编码的时候，主要是通过一些系统调用和 `Socket` 打交道。

在 Java 中，网络通信这块 `netty` 提供了很大的便利，但是你了解了这些原理之后，`netty` 你也了解的差不多了。

### 内核参数说明

[/proc/sys/net/\* 说明](https://www.kernel.org/doc/Documentation/sysctl/net.txt)

[TCP/IP 内核参数说明](https://www.kernel.org/doc/Documentation/networking/ip-sysctl.txt)

[文件系统部分 /proc/sys/fs/\* 说明](https://www.kernel.org/doc/Documentation/sysctl/fs.txt)

```txt
https://www.kernel.org/doc/Documentation/sysctl/net.txt
https://www.kernel.org/doc/Documentation/networking/ip-sysctl.txt
https://www.kernel.org/doc/Documentation/sysctl/fs.txt
```

修改内核参数，有两种改法，比如修改 `tcp_syn_retries = 5`

-   临时修改

```bash
# 查看参数的完整值 net.ipv4.tcp_syn_retries = 6
sysctl -a  | grep tcp_syn_retries
# linux 一切皆文件，所以这个东西也是会在文件中保存，我们可以修改这个文件内容，临时生效，重启之后就不影响
# 内核属性文件路径都是在 /proc/sys 下，剩余的路径就是 net.ipv4.tcp_syn_retries 中的 . 替换为 /
echo 5 > /proc/sys/net/ipv4/tcp_syn_retries

# 查看修改之后的值
sysctl -a  | grep tcp_syn_retries
```

-   永久修改

```bash
# tcp_syn_retries = 7
echo "net.ipv4.tcp_syn_retries = 7" >> /etc/sysctl.conf

# 让修改生效
sysctl -p

# 查看修改之后的值
sysctl -a  | grep tcp_syn_retries
```

### 本文内容

-   BIO 通信模型（画图说明）及 java 代码实现
-   NIO 通信模型及 java 代码实现
-   多路复用通信模型（画图说明），主要是 `epoll`，会详细讲解

通信模型是按照 `BIO` -> `NIO` -> `多路复用` 慢慢演变过来的，因为互联网的发展，并发要求比较高。

[本文所用代码地址](https://github.com/zhangpanqin/fly-java-socket)

```txt
https://github.com/zhangpanqin/fly-java-socket
```

本文内容环境：

-   jdk .18
-   Linux version 3.10.0-693.5.2.el7.x86_64

## BIO 通信

![Socket 通信 (1)](http://oss.mflyyou.cn/blog/20200719112747.svg?author=zhangpanqin)

`BIO 通信模型` 中，`服务端` `ServerSocket.accpet` 会阻塞等待新的客户端经过 `TCP 三次握手` 建立连接，当客户端 `Socket` 建立了链接，就可以通过 `ServerSocket.accpet` 得到这个 `Socket` ，然后对这个 `Socket` 进行读写数据。

`Socket` 读写数据时，会阻塞当前线程直到操作完成，因此我们需要为每个客户端分配一个线程，然后在线程中死循环从 `Socket` 读取数据（客户端发来的数据）。还需要分配一个线程池对 `Socket` 进行写数据 （发送数据到客户端）。

<img src="http://oss.mflyyou.cn/blog/20200719151354.svg?author=zhangpanqin" alt="Java Bio"  />

应用程序调用系统调用 `read` 将数据从 `内核态` 到 `用户态` ,这个过程在 `BIO` 中是阻塞的。而且数据你不知道什么时候过来，只能在一个线程中死循环查看数据是否可读。

```java
try {
    // 当内核没有准备好数据的时候，一直在这里阻塞等待数据到来
    while ((length = inputStreamBySocket.read(data)) >= 0) {
        s = new String(data, 0, length, StandardCharsets.UTF_8);
        if (s.contains(EOF)) {
            this.close();
            return;
        }
        log.info("接收到客户端的消息,clientId: {} ,message: {}", clientId, s);

    }
    if (length == -1) {
        log.info("客户端关闭了,clientId: {},服务端释放资源", clientId);
        this.close();
    }
} catch (IOException e) {
    if (length == -1) {
        this.close();
    }
}
```

服务端主动往客户端写数据，应用程序调用 `write` 也是阻塞的。 我们可以通过线程池来做。为每个客户端会分配一个 id 属性维持会话，用 `ConcurrentHashMap<Integer, SocketBioClient>` 保持，要想 1 号客户端写数据，直接从这个 `Map` 拿出客户端，然后往里面写入数据。

```java
public void writeMessage(Integer clientId, String message) {
    Objects.requireNonNull(clientId);
    Objects.requireNonNull(message);
    // 根据客户端 id 取出客户端。
    final SocketBioClient socketBioClient = CLIENT.get(clientId);
    Optional.ofNullable(socketBioClient).orElseThrow(() -> new RuntimeException("clientId: " + clientId + " 不合法"));
    // 在线程池中运行写入数据
    threadPoolExecutor.execute(() -> {
        if (socketBioClient.isClosed()) {
            CLIENT.remove(clientId);
            return;
        }
        socketBioClient.writeMessage(message);
    });
}
```

`BIO 通信` 在并发比较大的时候，就显得力不从心了。比如有五万链接建立，就需要建立五万个线程来进行维护通信。在 `java` 中线程占用的内存假设为 `512KB`，内存占用 `24GB(50000*0.5/1024GB)`，还有 CPU 需要调度五万个线程来读取客户端数据和应答，CPU 绝大数的资源都会浪费在线程切换上去了，并且通信的实时性更不能保证。

## 全连接队列和半链接队列

1、服务端需要绑定一个 `serverIp` 和 `serverPort` ; java 中 api 为 `ServerSocket.bind`

2、然后在这个 `serverIp` 和 `serverPort` 上监听客户端的链接的到来

3、客户单绑定一个 `clientIp` 和 `clientPort`，然后调用 `Socket.conect(serverIp,serverPort)`，经过内核建立 Tcp 链接。

4、然后在服务端死循环调用 `ServerSocket.accept` 拿到建立连接 `Socket`

5、`Socket.read` 读取客户端发来的数据，`Socket.wirte` 写数据到客户端

`serverIp` 和 `serverPort` 是确定的，只要 `clientIp` 和 `clientPort` 只要有一个不同就可以看做是不同的客户端。

`clientIp` `clientPort` `serverIp` `serverPort` 在通信中也叫四元组，这四个确定才能建立 `TCP/IP` 链接。

比如我们的浏览器加载页面的时候，实际是随机创建了一个合法 `本地 port` ，加上已知的 `clientIp` 去请求 `serverIp` 和 `serverPort` 获取数据。

![TCP 链接建立 (2)](http://oss.mflyyou.cn/blog/20200726150610.svg?author=zhangpanqin)

​ 客户端链接服务端的 `TCP` 三次握手过程：

1、`客户端` 发送一个 `SYN` 包给服务端，在 `客户端` 运行 `netstat -natp` ，可以查看到处于 `SYN-SENT` 状态

2、`服务端` 接受到 `客户端` `SYN` 包，将连接放入半链接队列，然后发送 `客户端` 一个 `SYN+ACK` 包，状态处于 `SYN_REVD`

3、`客户端` 收到来服务端的 `SYN+ACK` 包，回复一个 `ACK`，状态处于 `ESTABLISHED` (服务端全连接队列满的时候，客户端链接也是这个状态，当你发送数据的时候，服务端会回复一个 `RST` 包重置链接)

4、`服务端` 收到来自客户端的 `ACK`，链接状态变为 `ESTABLISHED` （只有服务端看这个状态状态的链接才是真正 TCP 链接过程走完的），并将连接放入到全连接队列

队列是一个有界队列，当全连接队列和半链接队列溢时，会有配置的内核参数决定采用对应的策略处理。

### TCP 抓包

```bash
 # wireshark,需要安装这个程序，抓包相关的截图，我使用的 wireshark，mac 也有对应程序
 # -i 指定抓取那个网卡，port 指定只显示这个 port 的包
 tshark -i eth0 port 10222

 # linux 自带
 tcpdump -nn -i eth0 port 10222
```

### 全连接队列溢出

我在写代码验证及抓包的时候发现，设置的全队列长度为 10，但是可以建立 11 个链接，12 个链接建立的时候就发生了全连接溢出。

```bash
cat /proc/sys/net/ipv4/tcp_abort_on_overflow

# 临时修改
echo 1 > /proc/sys/net/ipv4/tcp_abort_on_overflow
# 临时修改，修改为 2 之后，发现重试只有两次了
echo 2 > /proc/sys/net/ipv4/tcp_synack_retries
```

当 `tcp_abort_on_overflow` 为 0 时（默认），表示如果第三次握手（客户端发送了 `ACK`）的时候，全连接队列满了，服务端会发送给客户端一个包让其重试发送 `ACK`。`sysctl -a | grep tcp_synack_retries` 查看服务端配置第三次握手重试的次数，默认为 5 次。

![image-20200725201134175](http://oss.mflyyou.cn/blog/20200725201134.png?author=zhangpanqin)

TCP 三次握手中的第三次客户端发送 `ACK` 给服务端，全连接队列满了，会丢弃第三次的 `ACK` 包，所以后续的过程中，是客户端再次发送 `ACK` 的包给服务端，服务端一直丢弃，所以，客户端一直发送 `ACK`。

当 `tcp_abort_on_overflow` 为 1 时，表示如果第三次握手（客户端发送了 `ACK`）的时候，全连接队列满了，服务端会回复一个 `RST` 包，关闭连接过程

![image-20200725200200971](http://oss.mflyyou.cn/blog/20200725200201.png?author=zhangpanqin)

### 半链接队列溢出

半链接队列的长度计算公式，来源于 [从一次 Connection Reset 说起，TCP 半连接队列与全连接队列](<[https://cjting.me/2019/08/28/tcp-queue/#%E5%85%A8%E8%BF%9E%E6%8E%A5%E9%98%9F%E5%88%97%E6%BA%A2%E5%87%BA](https://cjting.me/2019/08/28/tcp-queue/#全连接队列溢出)>)

-   `backlog`，`listen` 时传入的参数，我传入的 10
-   `somaxconn` ，我的是 128
-   `tcp_max_syn_backlog`，我的为 128

[somaxconn 和 tcp_max_syn_backlog 参数含义](https://www.kernel.org/doc/Documentation/networking/ip-sysctl.txt)

```bash
# 查看对应端口的 Send-Q
ss -lnt

# net.core.somaxconn = 128
sysctl -a | grep somaxconn

# net.ipv4.tcp_max_syn_backlog = 128
sysctl -a | grep tcp_max_syn_backlog
```

syn flood 攻击，模拟半链接溢出

```bash
# -p 指定端口
# --rand-source 伪造源 ip
# -S 只发送 SYN 包
# --flood 不停的攻击
# 10.211.55.8 攻击的目的 ip
hping3 -S --flood --rand-source -p 10222 10.211.55.8
# 计算半链接的数量
netstat -natp | grep SYN | wc -l
```

我分别将 `backlog` 设置为 7，123，511 测试的公式正确

```txt
nr_table_entries = min(backlog, somaxconn, tcp_max_syn_backlog)
nr_table_entries = max(nr_table_entries, 8)
// roundup_pow_of_two: 将参数（nr_table_entries + 1）向上取整到最小的 2^n
nr_table_entries = roundup_pow_of_two(nr_table_entries + 1)
max_qlen_log = max(3, log2(nr_table_entries))
max_queue_length = 2^max_qlen_log
```

`SYN FLOOD` 的防御

客户端发送大量的 SYN 包，然后就不走后面的握手过程，导致服务端半链接队列满了，无法接受正常用户的握手链接。

```bash
# 默认为 1，开启 syn cookie
cat /proc/sys/net/ipv4/tcp_syncookies

# 临时修改为 0 ，tcp_syncookies
echo 0 > /proc/sys/net/ipv4/tcp_syncookies
```

内核参数 `tcp_syncookies` 设置可以帮我们做一些防御 `SYN FLOOD` 攻击，当设置为 0 的时候，半链接队列满了，服务端会丢弃客户端的 `SYN` 包，客户端链接的时候，没有收到 `SYN+ACK` 会重试发送 `SYN` 包，超过了重试次数，建立连接失败。

linux 中是内核参数 `net.ipv4.tcp_syn_retries = 6` ，限制 `SYN` 重试次数，当前半链接队列已经满了，新的正常链接建立的时候，重试发送的 `SYN` 次数。

当设置 `tcp_syncookies=0` 时，是不能抵御 `SYN FLOOD` 攻击的，新的正常用户建立不了链接。

![image-20200726134431509](http://oss.mflyyou.cn/blog/20200726134558.png?author=zhangpanqin)

当设置 `tcp_syncookies=1` 时，新的正常链接（走三次握手）还是可以建立 TCP 连接的，前提是 `全连接队列没有满`，全连接队列满了，走全连接队列的逻辑。

```bash
# 临时修改
echo 1 > /proc/sys/net/ipv4/tcp_syncookies
```

全连接队列没有满，服务端会回复一个带 `syncookie` 的 `SYN+ACK` 包给客户端，就是给这个包加一个会话标识，客户端收到这个 `SYN+ACK` 包必须将 `syncookie` 携带发送 `ACK` 才能建立三次握手的链接。

全连接队列满的话会从上面全连接队列。

[Socket Bio 通信 GitHub 地址](https://github.com/zhangpanqin/fly-java-socket/tree/master/socket-bio)

## NIO 通信

从 `BIO` 演变到 `NIO` ,只是支持了同步非阻塞。不要小看非阻塞这个特性，他可以将我们的线程模型降低为一个（在不考虑读写客户端实时性的情况下），`BIO` 不管你怎么修改，始终都要一个客户端对应一个读线程。`NIO` 在不考虑性能的情况下，理论可以一个线程管理 n 个客户端。

`ServerSocketChannel.accept` 可以不阻塞等待客户端建立连接；

```java
while (true) {
    try {
        // bio 会在这里阻塞等待新的客户端建立。
        // nio 不阻塞等待，有链接建立，返回客户端。没有链接返回 null
        final SocketChannel accept = serverSocket.accept();
        if (Objects.nonNull(accept)) {
            accept.configureBlocking(false);
            final int currentIdClient = CLIENT_ID.incrementAndGet();
            final SocketNioClient socketNioClient = new SocketNioClient(currentIdClient, accept);
            CLIENT.put(currentIdClient, socketNioClient);
            new Thread(socketNioClient, "客户端-" + currentIdClient).start();
        }

    } catch (IOException e) {
        log.info("接受客户端你失败", e);
    }
}
```

SocketChannel.read 可以不阻塞等待数据从内核态到用户态，内核态中没有数据，直接返回。

```java
ByteBuffer byteBuffer = ByteBuffer.allocateDirect(1024);
while (true) {
    // bio 不管有没有数据，都要在这里等待读取
    // nio 当内核中没有数据可以读取，内核会返回 0
    length = this.client.read(byteBuffer);
    if (length > 0) {
        byteBuffer.flip();
        s = StandardCharsets.UTF_8.decode(byteBuffer).toString();
        log.info("接收到客户端的消息,clientId: {} ,message: {}", clientId, s);
        if (s.contains(EOF)) {
            this.close();
            return;
        }
    }
    if (length == -1) {
        log.info("客户端主动关闭了,clientId: {},服务端释放资源", clientId);
        this.close();
        return;
    }
	// 这里在内核没有准备好数据的时候，可以在这里执行一些别的业务代码
}
```

在 NIO 模型下，一个线程就可以管理所有的读写了(不考虑响应客户端的实时性 )。

```java
package com.fly.socket.nio;

import com.fly.socket.nio.chat.model.ChatPushDTO;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.ServerSocketChannel;
import java.nio.channels.SocketChannel;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * @author 张攀钦
 * @date 2020-07-19-16:32
 */
@Slf4j
public class NioSingleThread implements AutoCloseable {
    // 客户端发送这个消息，说明要断开连接，服务端主动断开连接
    private static final String EOF = "exit";
    // 保存会话，由于这个是在单线程中操作的，不需要用并发容器
    private static final Map<Integer, SocketChannel> MAP = new HashMap<>(16);
    // http 接口主动发消息时，将消息保存在这个队列中
    private static final ConcurrentLinkedDeque<ChatPushDTO> QUEUE = new ConcurrentLinkedDeque<>();
    // 因为单线程操作，所以直接申请堆外 buffer，这样性能高，没有考虑能不能接受客户端发送消息的大小，简单写法，只考虑 1024 个字节。
    final ByteBuffer byteBuffer = ByteBuffer.allocateDirect(1024);
    // 服务端 socket 绑定那个 端口
    private int port;
    // 全链接队列的 backlog,不理解这个属性，看上面的 BIO
    private int backlog;
    // 本次绑定 ServerSocketChannel
    private ServerSocketChannel open;

    // NioSingleThread 会注册到 ioc 中，closed 标记是否调用了NioSingleThread bean 被销毁时调用的 close 方法
    private boolean closed = false;

    public ServerSocketChannel getOpen() {
        return open;
    }

    public NioSingleThread(int port, int backlog) {
        this.port = port;
        this.backlog = backlog;
        try {
            open = ServerSocketChannel.open();
            // 设置使用 NIO 模型, ServerSocketChannel.accept 时候不阻塞
            open.configureBlocking(false);
            open.bind(new InetSocketAddress(port), backlog);
            this.init();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * @Bean(destroyMethod = "close")
     * public NioSingleThread nioSingleThread() {
     * 	return new NioSingleThread(9998, 20);
     * }
     */
    @Override
    public void close() throws IOException {
        closed = true;
        if (Objects.nonNull(open)) {
            if (!open.socket().isClosed()) {
                open.close();
                log.info("关闭客户端了");
            }
        }
    }

    // 初始化之后，启动了一个线程
    private void init() {
        new Thread(
            () -> {
                Integer clientIdAuto = 1;
                while (true) {
                    // 先判断这个 bean 是否被销毁了，销毁了，说明服务端的在关闭，顺便也关闭 socket
                    if(closed){
                        if (open.socket().isClosed()) {
                            try {
                                open.close();
                            } catch (IOException e) {
                                e.printStackTrace();
                            }
                        }
                        return;
                    }
                    try {
                        // 处理新的客户端链接建立
                        final SocketChannel accept = open.accept();
                        if (Objects.nonNull(accept)) {
                            accept.configureBlocking(false);
                            MAP.put(clientIdAuto, accept);
                            clientIdAuto++;
                        }

                        // 处理读取事件
                        MAP.forEach((clientId, client) -> {
                            if (!client.socket().isClosed()) {
                                byteBuffer.clear();
                                try {
                                    final int read = client.read(byteBuffer);
                                    if (read == -1) {
                                        client.close();
                                        MAP.remove(clientId);
                                    }
                                    if (read > 0) {
                                        byteBuffer.flip();
                                        final String s = StandardCharsets.UTF_8.decode(byteBuffer).toString();
                                        log.info("读取客户端 clientId: {} 到的数据: {}", clientId, s);
                                        if (s.contains(EOF)) {
                                            if (!client.socket().isClosed()) {
                                                client.close();
                                            }
                                        }
                                    }

                                } catch (IOException e) {
                                    log.error("读取数据异常,clientId: {}", clientId);
                                }
                            }

                        });

                        // 处理写事件
                        while (!QUEUE.isEmpty()) {
                            final ChatPushDTO peek = QUEUE.remove();
                            if (Objects.isNull(peek)) {
                                break;
                            }
                            final Integer chatId = peek.getChatId();
                            final String message = peek.getMessage();
                            final SocketChannel socketChannel = MAP.get(chatId);
                            if (Objects.isNull(socketChannel) || socketChannel.socket().isClosed()) {
                                continue;
                            }

                            byteBuffer.clear();
                            byteBuffer.put(message.getBytes(StandardCharsets.UTF_8));
                            byteBuffer.flip();
                            socketChannel.write(byteBuffer);

                        }


                    } catch (IOException e) {
                        throw new RuntimeException("服务端异常", e);
                    }
                }
            }, "NioSingleThread"
        ).start();

    }

	// 对外暴露的接口，写事件
    public void writeMessage(ChatPushDTO chatPushDTO) {
        Objects.requireNonNull(chatPushDTO);
        QUEUE.add(chatPushDTO);
    }
}

```

[NIO 代码 GitHub 地址](https://github.com/zhangpanqin/fly-java-socket/tree/master/socket-nio)

`NIO` 模型已经不错了，减少了线程和内存占用。但是它有一个弊端就是客户端有没有数据还是需要调用系统调用 `read` 来看看是否有数据到达。

当比如有五万个链接的时候，我们需要调用系统调用五万次 `int read = client.read(byteBuffer)`，换而言之用户态到内核态需要切换五万次，这也是不小的计算机资源消耗。

`IO 模型` 继续演变到目前常用比较广泛的 `多路复用`，它解决了这个系统调用多次的问题，将五万次的系统调用减少到一次或者多次。

## IO 多路复用

`NIO` 存在的弊端：不管你客户端有没有数据传过来，我都要调用系统调用看看有没有数据到来。

客户端建立连接之后，内核会为这个客户端分配一个 `fd(文件描述符)`。

`IO 多路复用` 指的是内核监控客户端（fd）有没有数据到来，当我们想要知道哪些客户端数据到来了，只需要调用多路复用器 `select` , `poll` , `epoll` 提供的系统调用即可，将想要知道的客户端（fd）传进去，内核就会返回哪些客户端（fd）数据准备好了。我们从原来的五万次系统调用，降低到一次，大大降低了系统开销。`epoll` 是这三个多路复用器中效率最高的一个。

1、`select` 一次调用传入的 fd 是有数量限制的（一次只能传入 1024 个，不同的内核参数可能会不同），五万链接会调用 30 次左右系统调用，但是内核还是会遍历这五万个链接，检查是否有数据可读。然后调用对应的系统调用，获得有数据到达的客户端 （fd），然后操作 `fd` 将数据从 `内核态` copy 到 `用户态` 去做业务处理。

2、`poll` 和 `select` 差不多，只是系统调用时传入的 fd 没有限制。`poll` 和 `select` 只是减少了系统调用，实际内核也是遍历每个链接检查是否可读，所以效率和连接总数成线性关系，建立连接的客户端越多效率越低。

3、`epoll` 不是内核轮训每个 `fd` 检验是否可读。当客户端数据到达，内核将网卡中将数据读到到自己的内存空间，内核会将有数据到达的连接放入到一个队列中去，用户态的程序只需要调用 `epoll` 提供的系统调用，从这个队里中拿到链接对应的 `fd` 即可，所以效率和活跃连接数有关，和连接总数没有关系（百万链接中可能只有 20% 是活跃链接）。

### epoll 相关的系统调用

`epoll` 内部维护了一个红黑树和队列，红黑树记录当前多路复用器需要监测哪些链接的那些操作（读写等），队列中就是哪些操作就绪的链接。

#### `epoll_create`

```java
//  返回文件描述符，这个文件描述符对应 epoll 实例，fd 在后续 epoll 相关的系统调用中有用
int epoll_create(int size);
```

`epoll_create` 创造一个多路复用器实例 `epoll`，返回一个 `epfd`，这个 `epfd` 指向了`epoll`的实例。`epfd` 实际就是一个文件描述符。

#### `epoll_ctl`

```java
int epoll_ctl(int epfd, int op, int fd, struct epoll_event *event);
```

`epoll_ctl` 将客户端或者服务端对应的 socket fd 注册 epoll 上，op 就是指定当前系统调用的类型，是将 fd 注册到 epoll ，还是从 epoll 删除 fd，还是修改在 epoll 上 event 。event 指的是 io 操作（读、写等）。

`epoll_ctl` 设置 epoll 的实例监听哪些客户端或者服务端，并且指定监听它们的那些 io 操作。

#### `epoll_wait`

```
# epoll 返回了准备好 io 操作的 fd 的数量
int epoll_wait(int epfd, struct epoll_event *events,int maxevents, int timeout);
```

获取当前多路复用器（epfd）上有多少个客户端 io 操作就绪（注册 epoll 中时指定的操作）。`epoll_wait` 当没有指定 timeout 时，会一直阻塞等待至少有一个客户端 `io` 操作就绪。`timeout` 大于 0 会在超时时直接返回 0。

epoll_event 是接受这个系统调用中准备好的事件，事件数据结构中可以拿到对应的客户端 fd。

`epoll_wait` 是阻塞调用，返回的话：

-   有 io 操作就绪

-   指定的超时时间到了

-   调用被打断就会返回

### epoll 触发方式

epoll 监控多个文件描述符的 io 事件，什么样的情况 epoll 认为是可以读写呢，这是就事件的触发方式。epoll 支持两重触发方式，边缘触发（edge trigger，ET）和水平触发 (level trigger，LT)。

每个 `fd` 缓冲区，fd 缓冲区中又可以分为读缓冲区和写缓冲区。每个客户端链接对应一个 fd。

客户端数据来了，网卡会将客户端来的数据从网卡的内存中写入到链接对应内核中的 fd 读缓冲区。应用程序调用 `epoll_wait` 知道那个链接有数据到达了，再将这个数据从内核态读到用户态，然后做数据处理。

往客户端写数据。应用程序调用 socket (对应一个 fd) api，将数据从用户态写入到内核态中的 fd 写缓冲区中去，然后内核会将数据写入到网卡中去，网卡在适当的时机再发给客户端。

如果 fd 的写缓冲区满了，当调用 write 的时候就会阻塞等待写缓冲区腾出空间来。

TCP 链接数据发送的时候，会有一个滑动窗口控制数据的发送。当发送的快，接受的慢，当超过了这个流量控制，发送的数据包，没有收到客户端发来的 `ACK` ，会继续重试发送数据包。

下图是在流控之内正常发送，服务端发包，客户端接收到，恢复一个 `ACK`。

<img src="http://oss.mflyyou.cn/blog/20200726191559.png?author=zhangpanqin" alt="image-20200726191559755" style="zoom:150%;" />

这个是流控之外没有发送成功，会等待接着发送的。

![image-20200726191825717](http://oss.mflyyou.cn/blog/20200726191825.png?author=zhangpanqin)

这个也和 fd 的读写缓冲区有关系，客户端的度读缓冲区满了，服务端再怎么发，也不会成功的。

服务端写数据到客户端，会从

#### 1、水平触发时机

-   对于读操作，只要读缓冲内容不为空，LT 模式返回读就绪。

-   对于写操作，只要写缓冲区不满，LT 模式会返回写就绪。

#### 2、边缘触发时机

##### 读操作

-   当缓冲区由不可读变为可读的时候，即缓冲区由空变为不空的时候。

-   当有新数据到达时，即缓冲区中的待读数据变多的时候。

##### 写操作

-   当缓冲区由不可写变为可写时。

-   当有旧数据被发送走，即缓冲区中的内容变少的时候。

边缘触发相当于只有增量的时候才会触发。

## Java 多路复用

Java 中对多路复用器的抽象是 `Selector` 。根据不同的平台通过 `SPI`获得不同的 `SelectorProvider`。

```java
// 根据 SPI 获取多路复用器，linux 是 epoll,mac 下是 KQueue
public abstract AbstractSelector openSelector()throws IOException;

// 获取服务端 socket
public abstract ServerSocketChannel openServerSocketChannel()throws IOException;

// 获取客户端 socket
public abstract SocketChannel openSocketChannel()throws IOException;
```

```java
public abstract class Selector implements Closeable {

	// 相当于 epoll_create ,创建一个多路复用器
    public static Selector open() throws IOException {
        return SelectorProvider.provider().openSelector();
    }

    // 相当于 epoll_wait
    // select 实现使用了 synchronized ，它的锁和 register 使用的锁有重复，当 select 阻塞的时候，调用 register 也会被阻塞。
    public abstract int select(long timeout)throws IOException;
    public abstract int select() throws IOException;

    // 打断 epoll_wait 的阻塞
    public abstract Selector wakeup();

    // 释放 epoll 的示例
    public abstract void close() throws IOException;

    // 方法在 AbstractSelector extends Selector
    protected abstract SelectionKey register(AbstractSelectableChannel ch,int ops, Object att);
}

```

```java
public abstract class SocketChannel extends AbstractSelectableChannel implements
        ByteChannel, ScatteringByteChannel, GatheringByteChannel, NetworkChannel {
    /**
     * 从通道读取数据是加锁的,方法线程安全。读取之后的结果 ByteBuffer 操作需要自己保证安全
     * synchronized(this.readLock)
     */
    @Override
    public abstract int read(ByteBuffer dst) throws IOException;

    /**
     * 将缓冲区的数据写入到通道中,加锁。但是 ByteBuffer 需要自己保证安全
     * synchronized(this.writeLock)
     */
    @Override
    public abstract int write(ByteBuffer src) throws IOException;
}
```

### 一个简单 Demo

```java
/**
 * @author 张攀钦
 * @date 2020-07-26-16:15
 */
public class SocketDemo1 {
    public static void main(String[] args) throws IOException {
        // 调用 socket() 系统调用获取 socketfd
        final ServerSocketChannel open = ServerSocketChannel.open();
        // 注册多路复用器的 socket 必须是非阻塞的
        open.configureBlocking(false);
        // 调用 bind 系统调用，将 socketfd 绑定特定的 ip 和 port
        open.bind(new InetSocketAddress("10.211.55.8", 10224), 8);
        // 调用 epoll_create 多创建一个多路复用器，epoll
        final Selector open1 = Selector.open();
        // epoll_ctl 让 epoll 监听 socketfd 的 哪些io 操作
        open.register(open1, SelectionKey.OP_ACCEPT);
        // 解决 Selector.select 阻塞的时候，调用 Selector.register 被阻塞的问题，这个点很重要，一定要理解
        final LinkedBlockingQueue<Runnable> objects = new LinkedBlockingQueue<>(1024);

        // 创建监听客户端的 epoll，可以根据业务，创建一定数量 epoll,每个 epoll 下监听一定量客户端链接
        Selector open2 = Selector.open();

        // 这个线程用于读取数据
        new Thread(() -> {
            while (true) {
                try {
                    // 调用这个方法会阻塞，阻塞的时候等待 io 操作，select 阻塞的时候锁没有释放，当调用 register 也被阻塞了，最终可能造成多个线程					  // 都被阻塞
                    int select = open2.select();
                    if (select > 0) {
                        final Set<SelectionKey> selectionKeys = open2.selectedKeys();
                        final Iterator<SelectionKey> iterator = selectionKeys.iterator();
                        while (iterator.hasNext()) {
                            System.out.println("随便输入数据");
                            // 可以在这里阻塞将数据从内核态读入到用户态，主要为了验证缓冲区和 Tcp 的滑动窗口
                            System.in.read();
                            final SelectionKey next = iterator.next();
                            iterator.remove();
                            if (next.isReadable()) {
                                final SocketChannel channel = (SocketChannel) next.channel();
                                final ByteBuffer allocate = ByteBuffer.allocate(1024);
                                final int read = channel.read(allocate);
                                // 长度为 -1 的时候说明客户端关闭了
                                if (read == -1) {
                                    channel.close();
                                }
                                if (read > 0) {
                                    allocate.flip();
                                    System.out.println(StandardCharsets.UTF_8.decode(allocate).toString());
                                }
                            }
                        }
                    }

                    // 在这里解决 select 阻塞 register 的问题。
                    final Runnable poll = objects.poll();
                    if (Objects.nonNull(poll)) {
                        poll.run();
                    }
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }).start();


        // 主要用于接受客户端的链接，并将链接注册到 epoll 的逻辑
        new Thread(() -> {
            while (true) {
                try {
                    if (open1.select(100) <= 0) {
                        continue;
                    }
                    final Set<SelectionKey> selectionKeys = open1.selectedKeys();
                    final Iterator<SelectionKey> iterator = selectionKeys.iterator();
                    while (iterator.hasNext()) {
                        final SelectionKey next = iterator.next();
                        iterator.remove();
                        if (next.isValid() & next.isAcceptable()) {
                            final ServerSocketChannel channel = (ServerSocketChannel) next.channel();
                            final SocketChannel accept = channel.accept();
                            if (Objects.nonNull(accept)) {
                                accept.configureBlocking(false);
                                objects.put(() -> {
                                    open2.wakeup();
                                    try {
                                        accept.register(open2, SelectionKey.OP_READ | SelectionKey.OP_WRITE);
                                    } catch (ClosedChannelException e) {
                                        e.printStackTrace();
                                    }
                                });
                                open2.wakeup();
                            }
                        }
                    }
                } catch (IOException | InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }).start();
    }
}

```

## 参考资料

[TCP/IP 介绍](http://www.eventhelix.com/RealtimeMantra/Networking/)
