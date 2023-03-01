---
title: 从Linux内核理解Java中的IO
top: false
cover: false
toc: true
mathjax: true
date: 2020-07-04 20:29:41
password:
summary: linux kernel java io
tags: 
    - Java-IO
    - Java
categories: Java
img:
---

## 前言

刚接触 Java  `IO` 的时候，  一直有一个 困惑：为什么 `BufferedInputStream` 比 `FileInputStream` 快? 随着对 `Linux` 了解，这个问题也得到解决。最近也在看 `Linux 内核` 方面的书，想了解程序在 `Linux` 上运行的过程，感觉收获还是很多的。

基于安全考虑，只有  `Linux内核` 才能权限去访问计算机的硬件，`Linux内核`会提供一些接口（系统调用）让我们可以和硬件交互。不过数据一般都是从`硬件` 到`内核态` ,再从 `Linux内核` 复制到 `用户态` 进程的内存空间中，这样进程才能对读取的数据进行处理。

![image-20200704231239764](http://oss.mflyyou.cn/blog/20200704231239.png?author=zhangpanqin)

本文内容：

- Linux 中的虚拟文件系统介绍
- Page Cache 和 Dirty Page
- Java api 写入的数据，什么时候会被刷新到磁盘中



## Linux 中 虚拟文件系统（VFS）

虚拟文件系统（Virtual File System，简称VFS）是Linux内核的子系统之一，它为操作文件（普通文件，socket 等）提供了统一的接口，屏蔽不同的硬件差异和操作细节。我们只需调用 `open` 、`read`、`write` 、`close`、`fsync` 这些系统调用，达到操作文件的目的。

我们实际看到的 linux的目录，实际就是 VFS 中的路径，我们可以通过将硬盘中的分区挂载到 `linux` 中的路径下，访问虚拟文件系统中的路径既可以访问硬盘中的内容。

`df -i` 可以看到 VFS 中路径挂载的分区。

![image-20200704233624173](http://oss.mflyyou.cn/blog/20200704233642.png?author=zhangpanqin)



```bash
# 将分区挂载到虚拟文件系统的 /boot 目录下
mount /dev/sda1 /boot

# 卸载分区
umount /boot
```



操作系统会将硬盘分成两个区域，一个是数据区，用于保存文件的数据；还有一个 `Inode` 区用于保存文件的元数据（文件创建者，文件创建时间，文件权限，文件大小，块位置等）。

硬盘的最小存储单位叫做"扇区"（Sector）,每个扇区储存512字节（相当于0.5KB）。`Linux 内核` 从硬盘读取内容时，不会一个扇区一个扇区读，而是一次性读取多个扇区，即一次性读取一个 `块（Block）`。文件的数据内容储存在 `块` 中。

基于以上介绍，可以知道，实际一个文件必须占有一个 `Inode` 和 至少一个 `block`。

`df -i` 可以查看分区中，`inode` 的使用情况和分区对应 `Linux` 下的文件路径。

查看文件的 `Inode`及 `块` 的基本大小（一般 4KB）

![image-20200705002110818](http://oss.mflyyou.cn/blog/20200705002110.png?author=zhangpanqin)



当应用程序调用系统调用 `open`，会返回一个文件描述符 （简称 FD，File Decsriptor）。我们可以把 `FD` 理解为文件的指针，这个指针会指向一个`Inode` 。多个 `FD` 可以指向同一个 `Inode`，FD 会维护一个对文件内容操作的偏移量（读写到什么地方了）。`FD` 是上层应用程序使用的，`Inode` 是内核维护使用的。

但是进程打开的 `FD` 是有限制的，所以我们需要关闭流（实际上就是释放申请的计算机资源），不然 `FD` 不释放，程序发起系统调用没有 `FD`可用就会报错。

`ulimit -n` 可以查看系统限制的进程打开 `FD` 的数量，当程序并发很高的时候，需要调大此值，不然会报 `(Too many open files)`

```java
public class ErrorOpenFile {
    public static void main(String[] args) throws IOException, InterruptedException {
        final Path path = Paths.get("/root/testfileio/out.txt");
        int count = 0;
        while (true) {
            // 为了查看 FD 的增长，所以设置阻塞五秒
            Thread.sleep(5000);
            count++;
            Files.newBufferedReader(path);
            System.out.println("打开一个文件描述符");
        }
    }
}
```



`/proc/pid/fd` 下可以看到一个进程打开的 `FD`,其中的 `0、1、2` 是默认输入(System.in)，输出(System.out)，错误输出(System.err)，每个程序都会有。

![image-20200705004254331](http://oss.mflyyou.cn/blog/20200705004254.png?author=zhangpanqin)



## 为什么 `BufferedInputStream` 比 `FileInputStream` 快?

下面的程序，`FileOutputStream` 和 `BufferedOutputStream` 循环 10000 次，写入相同大小的数据，`FileOutputStream` 用时 468 毫秒。`BufferedOutputStream` 用时 3 毫秒。

```java
public class IoOperation {
    static byte[] data = "1234567890\n".getBytes();
    static String path = "/root/testfileio/out.txt";
    static int count = 0;
    public static void main(String[] args) throws Exception {
        switch (args[0]) {
            case "0":
                testBasicFileIO();
                break;
            case "1":
                testBufferedFileIO();
                break;
            default:

        }
    }
    // 468 毫秒执行完 
    public static void testBasicFileIO() throws Exception {
        File file = new File(path);
        FileOutputStream out = new FileOutputStream(file);
        final long start = System.currentTimeMillis();
        while (count < 10000) {
            out.write(data);
            count++;
        }
        System.out.println(System.currentTimeMillis() - start);
        out.close();
    }
	// 3 毫秒执行完 
    public static void testBufferedFileIO() throws Exception {
        File file = new File(path);
        BufferedOutputStream out = new BufferedOutputStream(new FileOutputStream(file));
        final long start = System.currentTimeMillis();
        while (count < 10000) {
            out.write(data);
            count++;
        }
        System.out.println(System.currentTimeMillis() - start);
        out.close();
    }
}
```



`VFS` 抽象出来的系统调用（open,read,write,close）是让应用程序调用的。我们可以在 Linux 中使用 `man open(read/write/close)` 查看系统调用的意思

也可以在 [Linux 手册](https://man7.org/linux/man-pages/dir_section_2.html) `https://man7.org/linux/man-pages/dir_section_2.html` 看系统调用。

```bash
ssize_t write(int fd, const void *buf, size_t count);
```

`write 系统调用`，是把缓存区 buf 中的前 count 个字节写入到 fd 中，返回的是实际写入到文件中的字节数 ssize_t，ssize_t 可能小于 count。

`write 系统调用` 会触发进程从用户态切换到内核态，Cpu 需要保存进程用户态的上下文（代码执行到哪里了，相关数据等），再执行内核代码，执行完内核代码，还要切换回用户态，将进程的上下文再还原，相对来说进程态的切换是比较消耗 Cpu 资源的，我们应该减少 Cpu 资源的切换。

```bash
# 执行上面代码，并追踪系统调用
strace -ff -o /root/testfileio/out java com.fly.io.IoOperation $1
```

![image-20200705122935804](http://oss.mflyyou.cn/blog/20200705122935.png?author=zhangpanqin)

`FileInputStream` 会调用 10000 次系统调用，进程用户态到内核态切换了 10000 次，所以代码执行时间比较长。

`BufferedOutputStream` 有一个 `8192` 字节的缓冲区，当调用 `BufferedOutputStream.write` 会先写入这个缓冲区，在这个缓冲区满的时候，会将这个缓冲区的数据发起系统调用，这样减少了系统调用，所以用时比较少。



## Page Cache 和 Dirty Page

文件数据的持久化，也被称为 `落盘`。`内存`  的速度是  `硬盘` N 倍，他俩不是一个量级的。 所以 `Linux` 引入  `Page Cache`  来作为数据的缓存，当 `Page Cache` 被修改之后变为了 `Dirty Page`，Linux 会在适当时机（可以通过参数调节），将脏页的数据，刷新到硬盘中。也可以调用系统调用（fsync），将脏页刷新到硬盘。

当 `JAVA 程序` 调用 `FileOutputStream.write` 的时候，实际是将用户态的数据，写入到了内核态中的 `Page Cache` (一个 Page Cache 大小为 4KB 左右)，当我们调用 `FileOutputStream.close` 的时候，实际只是调用了系统调用 `close`，而没有落盘，这时对计算机断电，数据是没有持久化的。

当我们调用了 `FileOutputStream.getFD().sync()` 会触发系统调用 `fsync`，将数据落盘。

![image-20200704201130013](http://oss.mflyyou.cn/blog/20200704201130.png?author=zhangpanqin)

Linux 内核进行 Io 调度，来控制数据落盘，时机是：

1. 当空闲内存低于一个特定的阈值时，内核必须将脏页写回磁盘，以便释放内存。
2. 当脏页在内存中驻留时间超过一个特定的阈值时，内核必须将超时的脏页写回磁盘吧
3. 用户进程调用`sync(2)`、`fsync(2)`、`fdatasync(2)`系统调用时，内核会执行相应的写回操作。

一下是内核参数配置，进行控制内核的调度

`sysctl -a | grep dirty` 可以查看当前系统生效的配置

```properties
#若脏页占总物理内存10％以上，则触发flush把脏数据写回磁盘。内核后台线程写。
vm.dirty_background_ratio = 10
vm.dirty_background_bytes = 1048576
# 向内存写 pagecage 时，内核判断当前脏页占用物理内存的百分比，当超过这个值， 内核会阻塞掉写操作，并开始刷新脏页
vm.dirty_ratio = 10
vm.dirty_bytes = 1048576
# flush每隔5秒执行一次
vm.dirty_writeback_centisecs = 5000
#内存中驻留30秒以上的脏数据将由flush在下一次执行时写入磁盘
vm.dirty_expire_centisecs = 30000
```





代码验证 `FileOutputStream.close` 不会引起数据的落盘。为避免 Linux Io 调度的影响，我修改了内核的配置参数，这样数据只要没有调用系统调用 `fsync` 就不会触发系统调用。

```bash
# 编辑配置文件，将参数配置填入文件中
vim /etc/sysctl.conf

# 使配置生效
sysctl -p
```

```properties
vm.dirty_background_ratio = 90
vm.dirty_ratio = 90
vm.dirty_expire_centisecs = 300000
vm.dirty_writeback_centisecs = 50000
```





代码的逻辑为：往一个文件中写数据，然后关闭流，但是阻塞程序停止，程序停止，数据会刷新到磁盘中，然后模拟断电关闭虚拟机。

当打印 `没有落盘的时候`，`cat /root/testfileio/out.txt` 是可以看到数据的，当我断电重启之后，数据就没有了。说明 `close` 不能触发数据的落盘。

```java
public class IoOperation1 {
    static byte[] data = "1234567890\n".getBytes();
    static String path = "/root/testfileio/out.txt";
    static int count = 0;

    public static void main(String[] args) throws Exception {
        File file = new File(path);
        final FileOutputStream out = new FileOutputStream(file);
        while (count < 10) {
            out.write(data);
            count++;
        }
        out.close();
        System.out.println("没有落盘");
        Thread.sleep(1000000);
    }
}
```



当我们调用系统调用进行落盘的时候，断电重启虚拟机，发现 `out.txt` 是有数据的。

```java
public class IoOperation1 {
    static byte[] data = "1234567890\n".getBytes();
    static String path = "/root/testfileio/out.txt";
    static int count = 0;

    public static void main(String[] args) throws Exception {
        File file = new File(path);
        final FileOutputStream out = new FileOutputStream(file);
        while (count < 10) {
            out.write(data);
            count++;
        }
        // 发起了系统调用 fsync，进行数据的落盘
        out.getFD().sync();
        out.close();
        System.out.println("落盘");
        Thread.sleep(1000000);
    }
}
```









