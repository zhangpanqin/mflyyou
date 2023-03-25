---
title: 走进JVM-认识JAVA内存区域
---

## 前言

工作确定，房子也找好了，昨天电脑桌子也到位了，从今天开始博客进入正常更新状态。计划四月份之前将 JVM 相关的东西写完。

JVM 系列主要写一些类加载、java 内存区域，垃圾回收，jvm 参数配置，使用 java 工具、arthas 和 linux 命令定位解决问题

## JAVA 内存区域

JAVA 内存区域（JAVA 运行时数据区）不要和 JAVA 内存模型（JMM）混淆。

**JAVA 内存模型（JMM）定义了 Java 虚拟机(JVM)在计算机内存(RAM)中的工作方式**，java 内存模型指的是一套规范，规范线程如何访问内存。

![20180413163825001](/blog/20210323144335.png?author=zhangpanqin)

> 图片引用 https://luoyoubao.gitbooks.io/jvm/content/javanei-cun-mo-xing/javanei-cun-mo-xing.html

<img src="/blog/20210323144519.png?author=zhangpanqin" alt="20180615135951001" style="zoom: 67%;" />

> 图片引用 https://luoyoubao.gitbooks.io/jvm/content/chapter1.html

**JVM 被分为三个主要的子系统**：

1. 类加载器子系统
2. 运行时数据区
3. 执行引擎

类加载子系统负责从文件系统或者网络中加载 Class 信息，Class 信息放在方法区中。

### PC 寄存器（线程私有）

java 虚拟机中每个线程都有自己的 pc 寄存器。在任意时刻，一条线程只会执行一个方法代码。如果执行的方法不是 native，那么 pc 寄存器就保存正在执行的字节码指令的地址。如果是执行的是 native 方法，pc 寄存器的值是 null。PC 寄存区也是唯一一个不会抛出 OOM 异常的区域。

### JAVA 虚拟机栈（线程私有）

每条线程都有自己的虚拟机栈，这个栈和线程同时创建，用于储存局部变量或者指向堆的指针。在 Java 虚拟机规范中，如果方法递归调用太深会抛出 StackOverflowError 异常；当无法申请足够的内存时也会抛出 OOM 异常。

-Xss 用于调节栈的大小。

### native 方法栈（线程私有）

调用 native 方法时使用的栈，了解即可。当栈溢出时，抛出 StackOverflowError 异常 ；当申请内存失败时，抛出 OOM 异常。

### 堆（线程共享）

堆（heap）是线程共享的区域，垃圾回收也主要回收它，我们主要也是堆打交道。-Xms 和 -Xmx 用于调整堆的大小。

### 方法区（线程共享）

方法区是线程共享的内存区域，它存储 Class 的结构信息。例如，运行时常量池、字段、方法、构造函数。方法区使用的是本地内存（堆外内存），相当于在系统上申请的内存。方法区会抛出 OOM。方法区使用元数据空间来调整。

-XX:MaxMetaspaceSize: 设置，默认 -1 不限制。

-XX:MetaspaceSize:指定元空间初始空间大小。字节为单位。

## 内存区域异常抛出演示

![image-20210323171447455](/blog/20210323171447.png?author=zhangpanqin)

> 图片引用 https://mp.weixin.qq.com/s/hj2GcW5nHS6U8wVZM7YBFg

实际中我们主要关注的是堆、直接内存、栈、元数据区。

### 堆抛出 OOM

在 idea 启动程序的时候，传入虚拟机参数 -Xms100m -Xmx100m -XX:+HeapDumpOnOutOfMemoryError。并使用 jvisualvm 观察堆的使用情况。

运行结果会抛出 java.lang.OutOfMemoryError: Java heap space。

`HeapDumpOnOutOfMemoryError` 指定了抛出异常时 dump 内存到文件中。我们可以通过分析这个文件，看那些对象占用比较多，从而分析问题。

```java
/**
 * @author 张攀钦
 * @date 2021-03-23-15:23
 */
public class HeapOOM {
    static class Obj {
        private byte[] a = new byte[1024 * 1024 * 10];
    }

    public static void main(String[] args) {
        final ArrayList<Object> objects = Lists.newArrayList();
        int count = 0;
        while (true) {
            try {
                objects.add(new Obj());
                System.out.println("添加了多少次" + ++count);
            } catch (Throwable e) {
                e.printStackTrace();
            }
        }
    }
}
```

![image-20210323154208310](/blog/20210323154208.png?author=zhangpanqin)

### 栈溢出

-Xss 用于设置栈的大小。当栈调用深度过深，会抛出 StackOverflowError 异常。

-Xss512k 时，打印结果 `调用深度4868`。

-Xss256k 时，打印结果 `调用深度1889`。

```java
public class StackOverflowErrorDemo {

    private int count = 0;

    public void add() {
        count++;
        add();
    }

    public int getCount() {
        return count;
    }

    public static void main(String[] args) {
        final StackOverflowErrorDemo stackOverflowErrorDemo = new StackOverflowErrorDemo();
        try {
            stackOverflowErrorDemo.add();
        } catch (Error e) {
            System.out.println("调用深度" + stackOverflowErrorDemo.getCount());
        }
    }
}
```

### 方法区溢出

方法区主要是储存类加载的信息，我们可以通过动态代理来模拟出来。

-XX:MaxMetaspaceSize=20m 设置元空间大小。

```java
public class MetaOOM {
    public static void main(String[] args) throws NoSuchMethodException, IllegalAccessException, InvocationTargetException, InstantiationException {
        while (true) {
            try {
                Enhancer enhancer = new Enhancer();
                enhancer.setSuperclass(IMetaService.class);
                enhancer.setUseCache(false);
                enhancer.setCallback(new MethodInterceptor() {
                    @Override
                    public Object intercept(Object obj, Method method, Object[] args, MethodProxy proxy) throws Throwable {
                        return proxy.invoke(obj, args);
                    }
                });
                enhancer.create();
            } catch (Throwable e) {
                System.err.println(e.getMessage());
            }
        }
    }
}

interface IMetaService {
    void add();
}
```

### 直接内存溢出

直接内存（Direct Memory，也是堆外内存）的容量可以通过 `-XX:MaxDirectMemorySize` 设置。默认值是 64m。

一般 Nio 使用了直接内存。-XX:MaxDirectMemorySize=50m

```java
    public static void main(String[] args) {
        final ArrayList<Object> objects = new ArrayList<>();
        while (true) {
            try {
                objects.add(ByteBuffer.allocateDirect(1024 * 1024 * 10));
            } catch (Throwable e) {
                System.out.println(e.getMessage());
            }
        }
    }
```

![image-20210323173300937](/blog/20210323173300.png?author=zhangpanqin)
