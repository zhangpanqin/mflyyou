---
title: 从锁升级的角度理解 synchronized
---

## 前言

在 Java 中为保证线程安全，可以使用关键字 `synchronized` 保护代码，在多个线程之间同时只能有一个线程执行被保护的代码。

`synchronized` 锁的到底是什么？是对象，还是代码块呢？

保证线程安全已经有了 `synchronized` 为什么又会出现 `Lock` 呢，二者之间有什么区别呢？

`synchronized` 一定比 `Lock` 性能差吗？

`synchronized` 的锁升级过程是什么，偏向锁，轻量级锁，自旋锁，重量级锁怎么一步一步实现的？

## synchronized 使用

1、用在静态方法

```java
public class SimpleUserSync {
    public static int a = 0;
    // 相当于   synchronized (SimpleUserSync.class){a++;}
    public synchronized  static void addA_1() {
        a++;
    }
}
```

2、用在成员方法上

```java
public class SimpleUserSync {
    public static int a = 0;
    // 相当于   synchronized (this){a++;}
    public synchronized  void addA_1() {
        a++;
    }
}
```

3、用在代码块

```java
private static final Object LOCK =new Object();
public static void addA_2() {
    synchronized (LOCK){
        a++;
    }
}
```

## synchronized 原理

### 原理描述

如果对一项技术只停留在会用的阶段是远远不够的，原理性的知识可避免掉到坑里面去。

`JDK 1.6` 之前，还没有进行 `synchronized` 的优化。那个时候 `synchronized` 只要申请锁，`java 进程` 就会从 `用户态` 切换到 `内核态`,需要操作系统配合锁定，这种切换相对来说比较占用系统资源。

`Lock` 的实现的思想是：线程基于 `CAS` 操作在 `用户态` 自旋改变内部的 `state`，操作成功即可获取锁，操作不成功，继续自旋获取直到成功（分配的 cpu 时间执行完之后，再获取到 cpu 资源，仍接着自旋获取锁）。这种实现方式在锁竞争比较小的情况下，效率是比较高的。比起 `用户态` 切换到 `内核态`，让线程在哪里自旋一会效率是比较高的。如果一直自旋（比如说 1 分钟）获取不到锁，那`用户态` 切换到 `内核态` 比你自旋一分钟效率会高。

`Lock` 不一定比 `synchronized` 效率高，在锁竞争的几率极大的情况下，自旋消耗的资源远大于 `用户态` 切换到 `内核态`占用的资源。

`JDK 1.6` 对 `synchronized` 做了优化。在锁竞争不大的情况下，使用 `偏向锁` 和 `轻量级锁`，这样只用在 `用户态` 完成锁的申请。当锁竞争的时候呢，会让其自旋继续获取锁，获取 n 次还是没有获取到（自适应自旋锁），升级为 `重量级锁`，`用户态` 切换到 `内核态`，从系统层级获取锁。

锁升级的宏观表现大致是这个样子。自适应自旋锁，自旋的次数 n，是 `JVM` 根据算法收集其自旋多少次获取锁算出来的（JDK 1.6 之后），是一个预测值，随着数据收集越来越多，它也越准确。

`synchronized` 是通过锁对象来实现的。因此了解一个对象的布局，对我们理解锁的实现及升级是很有帮助的。

### 对象布局

<img src="/blog/20200613211643.png?author=zhangpanqin" alt="image-20200613211643599" style="zoom: 25%;" />

对象填充，是将一个对象大小不足 8 个字节的倍数时，使用 0 填充补齐，为了更高效效率的读取数据，64 java 虚拟机，一次读取是 64 bit（8 字节）。

#### 对象头（Object Header）

在 64 位 JVM 上有一个压缩指针选项-XX:+UseCompressedOops，默认是开启的。开启之后 `Class Pointer ` 部分就会压缩为 4 字节，对象头大小为 `12 字节`

![](/blog/20200613201507.png?author=zhangpanqin)

#### Mark Word

![图来自马士兵教育多线程公开课](/blog/20200613163707.png?author=zhangpanqin)

`偏向锁位` 和 `锁标志位` 是锁升级过程中承担重要的角色。

### Jol 查看对象信息

我们可以使用 `jol` 查看一个对象的对象头信息，已达到观测锁升级的过程

[ jol 官方示例](https://hg.openjdk.java.net/code-tools/jol/file/tip/jol-samples/src/main/java/org/openjdk/jol/samples/)

```xml
<dependency>
    <groupId>org.openjdk.jol</groupId>
    <artifactId>jol-core</artifactId>
    <version>0.10</version>
</dependency>
```

```java
public class JOLSample_01_Basic {
    public static void main(String[] args) throws Exception {
        out.println(ClassLayout.parseInstance(new JOLSample_01_Basic.A()).toPrintable());
    }

    public static class A {
        boolean f;
        int a;
    }

}
```

![image-20200613214753341](/blog/20200613214753.png?author=zhangpanqin)

## 锁升级过程

![图来自马士兵教育多线程公开课](/blog/20200613163442.png?author=zhangpanqin)

<font color=red>偏向锁是默认开启的，但是有个延迟时间</font>

```bash
# 查看偏向锁配置的默认参数
java -XX:+PrintFlagsInitial | grep -i biased

# 偏向锁启动的延迟，Java 虚拟机启动 4 秒之后，创建的对象才是匿名偏向，否则是普通对象
#intx BiasedLockingStartupDelay                 = 4000                                {product}
# 默认开启偏向锁
#bool UseBiasedLocking                          = true                                {product}
```

<font color=red>锁升级之后，用户线程不能降级。GC 线程可以降级</font>

### 普通对象到轻量级锁

```java
public class JOLSample_12_ThinLocking {
    public static void main(String[] args) throws Exception {
        A a = new A();
        ClassLayout layout = ClassLayout.parseInstance(a);
        out.println("**** 对象创建,没有经过锁竞争");
        out.println(layout.toPrintable());
        synchronized (a) {
            out.println("**** 获取到锁");
            out.println(layout.toPrintable());
        }
        out.println("**** 锁释放");
        out.println(layout.toPrintable());
    }

    public static class A {
    }
}
```

因为偏向锁的延迟，创建的对象为普通对象（偏向锁位 0，锁标志位 01），获取锁的时候，`无锁`（偏向锁位 0，锁标志位 01） 升级为 `轻量级锁`（偏向锁位 0，锁标志位 00），释放锁之后，对象的锁信息（偏向锁位 0，锁标志位 01）

<img src="/blog/20200613221547.png?author=zhangpanqin" alt="image-20200613221547109" style="zoom: 33%;" />

`synchronized (a)` 的时候，由 `a` 的 `Mark Word` 中锁偏向 0，锁标志位 01 知道锁要升级为轻量级锁。java 虚拟机会在当前的线程的栈帧中建立一个锁记录（Lock Record）空间，Lock Record 储存锁对象的 `Mark World`拷贝和当前锁对象的指针。

java 虚拟机，使用 `CAS` 将 a 的 `Mark Word（62 位）` 指向当前线程（main 线程）中 `Lock Record` 指针，CAS 操作成功，将 a 的锁标志位变为 00。

<img src="/blog/20200613224235.png?author=zhangpanqin" alt="image-20200613224235023" style="zoom:50%;" />

CAS 操作失败。会依据 a 对象 Mark Word 判断是否指向当前线程的栈帧，如果是，说明当前线程已经拥有锁了，直接进入代码块执行（可重入锁）。

如果 a 对象的 Mark Word 判断是另外一个线程拥有所，会升级锁，锁标志位改为 （10）。

轻量级锁解锁，就是将 `Lock Record` 中的 a 的 mark word 拷贝，通过 CAS 替换 a 对象头中的 mark word ,替换成功解锁顺利完成。

### 偏向锁

偏向锁是比轻量级锁更轻量的锁。轻量级锁，每次获取锁的时候，都会使用 CAS 判断是否可以加锁，不管有没有别的线程竞争。

偏向锁呢，比如说 T 线程获取到了 a 对象的偏向锁，a 的 Mark Word 会记录当前 T 线程的 id ,当下次获取锁的时候。T 线程再获取 a 锁的时候，只需要判断 a 的 Mark Word 中的偏向锁位和当前持有 a 锁的线程 id，而不再需要通过 CAS 操作获取偏向锁了。

延迟 6 秒创建 a 对象，这时已经过了偏向锁延迟的时间，创建的对象为可偏向对象。

```java
public class JOLSample_13_BiasedLocking {
    public static void main(String[] args) throws Exception {
        TimeUnit.SECONDS.sleep(6);
        final A a = new A();
        ClassLayout layout = ClassLayout.parseInstance(a);
        out.println("**** Fresh object");
        out.println(layout.toPrintable());
        synchronized (a) {
            out.println("**** With the lock");
            out.println(layout.toPrintable());
        }
        out.println("**** After the lock");
        out.println(layout.toPrintable());
    }
    public static class A {
        // no fields
    }
}
```

<img src="/blog/20200613231613.png?author=zhangpanqin" alt="image-20200613231613645" style="zoom: 33%;" />

### 重量级锁

写了一个 demo ，验证 偏向锁，轻量级锁，重量级锁的逐渐升级过程。

```java
public class JOLSample_14_FatLocking {
    public static void main(String[] args) throws Exception {
        // 延迟六秒执行例子，创建的 a 为可偏向对象
        TimeUnit.SECONDS.sleep(6);
        final A a = new A();
        ClassLayout layout = ClassLayout.parseInstance(a);
        out.println("**** 查看初始化 a 的对象头");
        out.println(layout.toPrintable());
        // 这里模拟获取锁，当前获取到的锁为 偏向锁
        Thread t = new Thread(() -> {
            synchronized (a) {
            }
        });
        t.start();
        // 阻塞等待获取 t 线程完成
        t.join();
        out.println("**** t 线程获得锁之后");
        out.println(layout.toPrintable());
        final Thread t2 = new Thread(() -> {
            synchronized (a) {
                // a 的存在两个想成竞争锁，锁升级为轻量级锁
                out.println("**** t2 第二次获取锁");
                out.println(layout.toPrintable());
                try {
                    TimeUnit.SECONDS.sleep(3);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });
		// 开启 t3 线程模拟竞争，t3 会自旋获得锁，由于 t2 阻塞了 3 秒，t3 自旋是得不到锁的，锁升级为重量级锁
        final Thread t3 = new Thread(() -> {
            synchronized (a) {
                out.println("**** t3 不停获取锁");
                out.println(layout.toPrintable());
            }
        });
        t2.start();
        // 为了 t2 先获得锁，这里阻塞 10ms ,再开启 t3 线程
        TimeUnit.MILLISECONDS.sleep(10);
        t3.start();t2.join();t3.join();
        // 验证 gc 可以使锁降级
        System.gc();
        out.println("**** After System.gc()");
        out.println(layout.toPrintable());
    }
    public static class A {}
}
```

```txt
**** 查看初始化 a 的对象头
com.fly.blog.sync.JOLSample_14_FatLocking$A object internals:
 OFFSET  SIZE   TYPE DESCRIPTION                               VALUE
      0     4        (object header)                           05 00 00 00 (00000101 00000000 00000000 00000000) (5)

**** t 线程获得锁之后
com.fly.blog.sync.JOLSample_14_FatLocking$A object internals:
 OFFSET  SIZE   TYPE DESCRIPTION                               VALUE
      0     4        (object header)                           05 f0 52 d3 (00000101 11110000 01010010 11010011) (-749539323)

**** t2 第二次获取锁
com.fly.blog.sync.JOLSample_14_FatLocking$A object internals:
 OFFSET  SIZE   TYPE DESCRIPTION                               VALUE
      0     4        (object header)                           f8 38 c3 10 (11111000 00111000 11000011 00010000) (281229560)

**** t3 不停获取锁
com.fly.blog.sync.JOLSample_14_FatLocking$A object internals:
 OFFSET  SIZE   TYPE DESCRIPTION                               VALUE
      0     4        (object header)                           5a 1b 82 d2 (01011010 00011011 10000010 11010010) (-763225254)

**** After System.gc()
com.fly.blog.sync.JOLSample_14_FatLocking$A object internals:
 OFFSET  SIZE   TYPE DESCRIPTION                               VALUE
      0     4        (object header)                           09 00 00 00 (00001001 00000000 00000000 00000000) (9)
```

观察各阶段对象头中的 `偏向锁位` 和 `锁标志位` 。可以看到锁在不断升级。然后看到 gc 之后，又变成了无锁。

`t2` 线程持有锁 `a` 的 `轻量级锁` 的时候，t3 也在获得 a 的 `轻量级锁`，`CAS` 修改 a 的 `Mark Word` 为 t3 所有失败。导致了锁升级为重量级锁，设置 a 的锁标志位为 10，并且将 `Mark Word` 指针指向一个 monitor 对象，并将当前线程阻塞，将当前线程放入到 `_EntryList` 队列中。当 t2 执行完之后，它解锁的时候发现当前锁已经升级为重量级锁，释放锁的时候，会唤醒 `_EntryList` 的线程，让它们去抢 a 锁。

```java
class ObjectMonitor() {
    _owner        = NULL; // 持有这把锁监视器线程
    _WaitSet      = NULL; // 处于wait状态的线程，会被加入到_WaitSet
    _EntryList    = NULL ; // 处于等待锁block状态的线程，会被加入到该列表
}
```

[Java Language Specification](https://docs.oracle.com/javase/specs/jls/se8/html/index.html)

```txt
Java Language Specification    https://docs.oracle.com/javase/specs/jls/se8/html/index.html
Every object, in addition to having an associated monitor, has an associated wait set. A wait set is a set of threads.

When an object is first created, its wait set is empty. Elementary actions that add threads to and remove threads from wait sets are atomic. Wait sets are manipulated solely through the methods Object.wait, Object.notify, and Object.notifyAll.
```

调用对象的 `Object.wait` 方法，该线程会释放锁，并将当前线程放入到 monitor 的 `_WaitSet` 队列中，等某个线程调用 `Object.notify, and Object.notifyAll`，实际就是唤醒 `_WaitSet` 中的线程。
