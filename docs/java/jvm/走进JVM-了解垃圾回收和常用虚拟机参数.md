---
title: 走进JVM-了解垃圾回收和常用虚拟机参数
top: true
cover: true
toc: true
mathjax: true
date: 2021-03-29 15:14:17
password:
summary: 垃圾回收和常用虚拟机参数
tags: JVM
categories: JVM
img:
---

## 前言

往期 JVM 系列文章

- [走进JVM-认识JAVA内存区域](https://mp.weixin.qq.com/s/BMFA62rQJDvdaH9R9ppPXQ) 

### 本文内容

- 垃圾回收和需要了解的垃圾回收算法
- 常用的 jvm 参数

下一篇介绍使用工具进行 gc 问题确认和调优

## 垃圾回收

Java 虚拟机提供了一套内存自动管理方案，我们不需要手动去回收内存，降低了编程的难度。

垃圾回收 （Garbage Collection，简称 GC）指的是内存中不在被使用的对象需要被回收掉，释放掉占着的内存。

### 可达性分析

怎么样才能判断一个对象是否可以被回收呢？通过 `GC Roots` 的根对象开始，根据引用关系向下搜索（搜索过程走的路径称为 `引用链`）,如果对象和 `GC Roots` 之间没有引用链，那么这个对象就可以视为 “垃圾” ，可以被回收。

<img src="http://oss.mflyyou.cn/blog/20210329153821.png?author=zhangpanqin" alt="可以作为GC Roots的对象" style="zoom:50%;" />

**在 java 中可以看做 GC Roots 的有：**

- 静态变量的引用
- Java 虚拟机中常驻对象（Class 对象）或者字符串常量池

- 方法中被调用时使用到的参数、局部变量等

方法的调用是通过在虚拟机栈中对栈帧压栈和弹栈完成的。每次函数的调用都有对应的一个栈帧压入到虚拟机栈中，函数调用结束都会有一个对应的栈帧弹出。栈帧中保存了当前函数的局部变量等结果。

![栈帧](http://oss.mflyyou.cn/blog/20210329154429.png?author=zhangpanqin)

因此当一个方法调用结束后，局部变量指向的对象如果没有 GC ROOTS 可达就会被回收掉。

```java
// 运行时 jvm 参数 -XX:+PrintGC -Xms150m -Xmx150m
public class StackGC {

    public void gc() {
        byte[] arr = new byte[1024 * 1024 * 50];
        System.gc();
        System.out.println("gc 方法内触发 gc");
    }

    public static void main(String[] args) {
        final StackGC stackGC = new StackGC();
        stackGC.gc();
        System.out.println("StackGC.gc 调用之后触发 gc");
        System.gc();
    }
}
```

**程序输出结果如下：**

```txt
[GC (System.gc())  55870K->52243K(147456K), 0.0021458 secs]
[Full GC (System.gc())  52243K->52046K(147456K), 0.0065241 secs]
gc 方法内触发 gc
StackGC.gc 调用之后触发 gc
[GC (System.gc())  52824K->52110K(147456K), 0.0014795 secs]
[Full GC (System.gc())  52110K->757K(147456K), 0.0055150 secs]
```

从 gc 日志可以看到，gc 方法内局部变量 gc 持有数组的引用，当我们手动调用 gc 时，可以看到内存并没有被回收。

当 gc 方法调用结束时，它对应的栈帧弹栈，数组并没有 gc root 可达，所以在 main 方法中手动 gc 可以触发内存回收。



**gc root 没有可达时，内存被回收掉例子**

```java
// 运行时 jvm 参数 -XX:+PrintGC -Xms150m -Xmx150m
public class StackGC {

    public void gc() {
        byte[] arr = new byte[1024 * 1024 * 50];
        // 只改变了这一处
        arr=null;
        System.gc();
        System.out.println("gc 方法内触发 gc");
    }

    public static void main(String[] args) {
        final StackGC stackGC = new StackGC();
        stackGC.gc();
        System.out.println("StackGC.gc 调用之后触发 gc");
        System.gc();
    }
}
```



```txt
[GC (System.gc())  55870K->52223K(147456K), 0.0017527 secs]
[Full GC (System.gc())  52223K->846K(147456K), 0.0059592 secs]
gc 方法内触发 gc
StackGC.gc 调用之后触发 gc
[GC (System.gc())  1625K->910K(147456K), 0.0009974 secs]
[Full GC (System.gc())  910K->731K(147456K), 0.0024071 secs]
```

从 gc 日志可以看到，gc 方法内手动垃圾回收，内存回收掉了。这是因为字节数组没有 gc root 可达，所以可以回收。



### 垃圾回收算法

![jvm堆空间](http://oss.mflyyou.cn/blog/20210329171328.png?author=zhangpanqin)

新生代采用 `标记-复制算法` ,new 对象首先分配到 eden 区，当经历一次垃圾回收还存活，对象会从 eden 复制到 s0，然后清空 eden 区，当再经历一次垃圾回收，对象会从 eden 到 s1，s0 存活的对象复制到 s1。标记-复制算法，会浪费一部分内存，但是它回收效率高速度快，不会产生内存碎片。

老年代通常使用 `标记-压缩算法` 和 `标记-清除算法` （CMS 垃圾收集器老年代采用此算法 ）。

gc 线程进行垃圾回收的时候，用户线程需要暂停执行业务代码，等到 gc 完成之后用户线程才可以执行业务代码。 

垃圾回收器有很多，通常使用组合是的是：

- 1.8 默认是 Parallel Scavenge (年轻代)+Serial Old (老年代) ，-XX:+UseParallelGC 使用此组合

- ParNew (年轻代)+CMS(老年代，默认使用 CMS，CMS 失败会使用 Serial Old )，jvm 参数只要添加 -XX:+UseConcMarkSweepGC 就可使用此组合
- Parallel Scavenge (年轻代)+Parallel Old (老年代)，-XX:+UseParallelOldGC
- G1(年轻代+老年代)，大内存（java 堆 8g 内存以上）基本使用它，1.9 以上默认使用的垃圾回收器，-XX:+UseG1GC



cms 和 g1 是为了较少的用户暂停时间。

而 ps + po 是为了追求吞吐量。

吞吐量=用户代码运行时间/(用户代码运行时间+垃圾回收时间)。

停顿时间越短，越适合需要与用户交互或者保证服务响应的程序。

高吞吐量可以更好的利用 cpu 资源，尽可能快的完成运算任务而不需要太多的交互。



垃圾回收的时候会出现 `Stop The World` 现象，这样的情况下，用户代码暂停执行。

```java
// -Xms1g -Xmx1g
public class STWDemo {
    public static void main(String[] args) {
        new Thread(() -> {
            while (true) {
                System.out.println(LocalDateTime.now());
                try {
                    Thread.sleep(50);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }
        ).start();
        final ArrayList<Object> objects = new ArrayList<>();
        for (int i = 0; i < 980*1024; i++) {
            objects.add(new byte[512]);
        }
        List list = new ArrayList<>();
        new Thread(() -> {
            while (true) {
                if (list.size() > 900*1024) {
                    list.clear();
                }
                for (int i = 0; i < 980*1024; i++) {
                    list.add(new byte[512]);
                }
            }
        }).start();
    }
}
```

如果没有进行垃圾回收的时候，基本上时间打印间隔为 50ms 。但由于 gc 导致 STW 导致程序严重执行受影响。

```txt
2021-03-29T18:45:01.522
2021-03-29T18:45:01.581
2021-03-29T18:45:01.634
2021-03-29T18:45:01.761
// 从这里开始执行，gc 影响了程序运行
2021-03-29T18:45:02.267
2021-03-29T18:45:02.429
2021-03-29T18:45:02.775
2021-03-29T18:45:02.911
2021-03-29T18:45:03.011
2021-03-29T18:45:03.280
2021-03-29T18:45:03.602
```



### 常用的 JVM 参数

标准： - 开头，所有的HotSpot都支持

非标准：-X 开头，特定版本HotSpot支持特定命令

不稳定：-XX 开头，下个版本可能取消。

布尔选项配置：`-XX:+OptionName` 启用布尔选项，使用减号 `-XX:-OptionName` 禁用布尔选项。

非布尔配置：-XX:OptionName=value

```shell
# java [-options] class [args...]
java -Dfile.encoding=UTF-8 -Xms1g -Xmx1g -Xloggc:gc.log -XX:+PrintGCDetails com.fly.blog.jvm.STWDemo 
# java [-options] -jar jarfile [args...]
java -Dfile.encoding=UTF-8 -Xms1g -Xmx1g -Xloggc:gc.log -XX:+PrintGCDetails a.jar 
```



我们通常会调整年轻代，老年代大小，eden s0 s1 大小，打印 gc 日志



#### 查看 JVM 参数值

```shell
# 打印 JVM 自动优化参数
java -XX:+PrintCommandLineFlags -version
# 查看初始值
java -XX:+PrintFlagsInitial -version
# 查看虚拟机使用最终参数，=未修改过，:=人为或JVM修改过
java -XX:+PrintFlagsFinal -version

# 也可以通过 jinfo 查看设置的值。或者动态修改一些参数
# 查看当前 java 进程，MetaspaceSize 的值
jinfo -flag MetaspaceSize pid
# 动态修改布尔类型值
jinfo -flag +UseParallelGC pid
# 动态修改数值型
jinfo -flag NewRatio=4 pid
```



#### 选择垃圾回收器

| 参数                    | 说明                                                         |
| ----------------------- | ------------------------------------------------------------ |
| -XX:+UseParallelGC      | 1.8 默认是 Parallel Scavenge (年轻代)+Serial Old (老年代)    |
| -XX:+UseConcMarkSweepGC | ParNew (年轻代)+CMS(老年代，默认使用 CMS，CMS 失败会使用 Serial Old ) |
| -XX:+UseParallelOldGC   | Parallel Scavenge (年轻代)+Parallel Old (老年代)             |
| -XX:+UseG1GC            | G1(年轻代+老年代)，大内存（java 堆 8g 内存以上）基本使用它，1.9 以上的默认垃圾回收器 |

#### 通用 JVM 参数

| 参数                               | 说明                                                         |
| ---------------------------------- | ------------------------------------------------------------ |
| -Xms                               | 设置堆的初始大小，通常和-Xmx 一样大，减少堆扩容带来的损耗，-Xms1g  或者 -Xms100m 或者 -Xms100k |
| -Xmx                               | 设置堆的最终大小。-Xmx1g  或者 -Xmx100m 或者 -Xmx100k        |
| -Xss                               | 虚拟机栈的大小，。线程数乘于-Xss 指定的大小，为线程占用的栈内存大小 |
| -Xmn                               | 调整堆中年轻代的大小                                         |
| -XX:NewRatio                       | -XX:NewRatio=4                                               |
| -XX:SurvivorRatio                  | 默认 -XX:SurvivorRatio=8，设置 eden 与 s0 的比值。当为 8 的时候，eden 占年轻代 8/10 ,s0 s1 各占 1/10 |
| -XX:MetaspaceSize                  | -XX:MetaspaceSize=64m 设置元空间初始大小                     |
| -XX:MaxMetaspaceSize               | -XX:MaxMetaspaceSize=128m 设置元空间最大大小                 |
| -XX:MaxDirectMemorySize            | 设置 nio 使用的直接内存（堆外）最大大小。                    |
| -XX:MaxTenuringThreshold           | -XX:MaxTenuringThreshold=15，新生代的对象经历了多少次垃圾回收之后放入到老年代 （对象对象头中记录分代年龄）,取值范围 0-15 |
| -XX:PretenureSizeThreshold         | -XX:PretenureSizeThreshold=5m，对象初始化占用内存大于这个值，直接分配到 老年代 |
| -XX:+UseTLAB                       | 默认启用 TLAB                                                |
| -XX:+PrintTLAB                     | 打印 TLAB 使用的情况                                         |
| -XX:+HeapDumpOnOutOfMemoryError    | 默认关闭的，当 oom dump 当前内存。                           |
| -XX:HeapDumpPath                   | -XX:HeapDumpPath=a.hprof，和 -XX:+HeapDumpOnOutOfMemoryError 配合一起使用 |
| -XX:+PrintGCDateStamps             | 打印每次 gc 的时间                                           |
| -XX:+PrintGCTimeStamps             | 每次 gc 的时间戳（距离 jvm 启动之后的时间戳）                |
| -XX:+PrintHeapAtGC                 | 打印 gc 之后的堆信息                                         |
| -XX:+PrintGCApplicationStoppedTime | 打印 gc stw 的时间                                           |
| -Xloggc                            | -Xloggc:gc.log，相对路径的话路径相对于 user.dir              |

#### G1常用参数

- -XX:+UseG1GC

使用 G1 垃圾收集器

- -XX:MaxGCPauseMillis=200

设置期望达到的最大GC停顿时间指标，JVM会尽力实现，但不保证达到

- -XX:GCPauseIntervalMillis

设置 gc 停顿间隔时间