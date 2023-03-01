---
title: 你需要了解 Lock 的前提-volatile
---

## 前言

java 中鼎鼎有名的 `AQS` 维护 `private volatile int state` 状态实现了用户态的锁。你如果不了解 `volatile` ，你看 `AQS` 的源码应该很难理解为什么 `Lock` 能保证共享变量线程安全。

`volatile` 绝对是你打通 java 的任督二脉的首要条件。`votaile` 的特性很简单，`可见性` 和 `禁止指令重拍` ，但是 `volatile` 并不能保证原子性，需要借助 cas 来保证原子性。

本文将会介绍如下内容：

-   `volatile` 的可见性是什么，有什么用
-   `volatile` 禁止指令重排是个什么东东
-   单例模式，饿汉式和懒汉式（DCL）的写法
-   伪共享是什么，怎么避免伪共享

## volatile

### 可见性

![image-20200620152106412](http://oss.mflyyou.cn/blog/20200620152106.png?author=zhangpanqin)

计算机 `CPU` 与 `主存` 交互的逻辑大致如图，`CPU` 的运算速度是 `主存` 的 100 倍左右，为了避免 `CPU` 被主存拖慢速度。当`CPU` 需要一个数据的时候，会先从 `L1` 找，找到直接使用；`L1` 中未找到，会去 `L2` 中，`L2` 中找不到会去 `L3` ，L3 找不到再去主存加载到 `L3`，再从 `L3`加载到 `L2` ，再从 `L2` 加载到 `L1`。为了避免每次加载运算数据都从主存中加载，`Cpu` 会将使用数据内存地址附近的数据也加载进来，因为通常内存分配是连续性的，目标数据附近的数据用到的可能性比较大。尽管可能浪费一部分存储空间，但是降低加载数据浪费的时间。这也就是以空间换时间。

多级缓存加载数据提高的计算速度，同时也面临数据不一致问题。

主存中现在有一个变量 a=1，`CPU1` a+1 之后，将结果 a=2 放入到 `L1` 去，但是后续代码计算还会用到 a，这时 `CPU1` 不会将 a=2 同步到主存中去。之后 `CPU2` 也从主存中取出变量 a（a=1），`CPU2` 将 a+2 的结果放入到 `L1` 中。这样就造成了数据不一致问题。缓存一致性协议就是为了解决这个问题的。

`缓存一致性协议` 是在计算机层面保证数据的一致性。`JAVA` 在自己的虚拟机中执行，也有自己的内存模型 `Java Memory Model (JMM)`，但不管怎么样，底层还是依靠的 `CPU` 指令集达到缓存一致性。`JAVA 内存模型` 屏蔽了不同操作系统（windows/linux/mac os）缓存一致性协议的不同实现细节，定义了 java 层面的接口，虚拟机要实现这个接口保证内存一致性。

![image-20200620153620353](http://oss.mflyyou.cn/blog/20200620153620.png?author=zhangpanqin)

Java 内存模型规定所有的变量全部储存在主存中，每个线程都有自己的工作内存，工作内存中的变量是主存变量的副本拷贝（使用那些变量，拷贝那些），每个线程只会操作自己工作内存的变量，当需要保存数据一致性的时候，线程会将工作内存中的变量同步到主存中去，然后让用到这个变量的别的线程，从主存中重新读取最新变量到自己的工作内存中去。

接下来代码体会一下，带不带 volatile 的区别。

```java
public class VolatileDemo {
    private static  int a = 0;
    public static void main(String[] args) throws InterruptedException {
        new Thread(() -> {
            while (a == 0) {
            }
        }, "线程 1").start();
        System.out.println("修改 a=1 之前");
        Thread.sleep(3000);
        a = 1;
        System.out.println("修改 a=1 之后");
    }
}
```

运行上面这个程序，代码会一直运行，不会停止。这是因为 `线程1` 的工作内存中 a 为 0 。尽管主线程修改了 a，但不会立刻将 a 同步到主存中去，同步到主存中去之后，也不会让别的线程感知到变量 a 已经变化了。由于 `线程 1` 始终认为 a 没有变化，所以程序会一直运行。

```java
public class VolatileDemo {
    // 代码的区别只是加了 volatile
    private static volatile int a = 0;
    public static void main(String[] args) throws InterruptedException {
        new Thread(() -> {
            while (a == 0) {

            }
        }, "线程 1").start();
        System.out.println("修改 a=1 之前");
        Thread.sleep(3000);
        a = 1;
        System.out.println("修改 a=1 之后");
    }
}
```

<font color=red>代码的区别只是变量 a 加了 volatile</font>

打印 `修改 a=1 之后` 程序停止。这是因为 `volatile` 标记的变量 a，主线程修改之后，并同步回主存，当其他的线程再使用变量 a 的时候，java 内存模型会让线程从主存重新加载变量 a。这就是 `volatile` 的 `可见性` 特点。只要 volatile 修饰的变量改变了，别的线程读取的时候立马感知到。

`volatile` 保证了写之后，任何读，都能读取到改变之后的值。(为了便于理解你也可以认为 ：volatile 修饰的变量存放在主存中，但实际不是这个样子，还是放在线程的本地内存中。）

### 禁止指令重排

java 中的字节码最终都会编译成机器码（CPU 指令）执行，CPU 在保证单线程中执行结果不变的情况下，可以对指令进行指令重排已达到提高执行效率。

编译器再不影响执行结果的前提下，在编译的时候也可以对指令进行重排。

```java
public class VolatileOrdering2 {
    static  int b = 1;
    public static void main(String[] args) throws InterruptedException {
        int a = 0;
        b = 2;
        a += 1;
        System.out.println(a);
    }
}
```

上述代码指令重排执行顺序的可能：

```java
int a=0;
a+=1;
System.out.println(a);
int b = 2;
```

网上也有人写的 demo 验证可能会发生指令重排的小程序

```java
public class T04_Disorder {
    private static int x = 0, y = 0;
    private static int a = 0, b =0;

    public static void main(String[] args) throws InterruptedException {
        int i = 0;
        for(;;) {
            i++;
            x = 0; y = 0;
            a = 0; b = 0;
            Thread one = new Thread(new Runnable() {
                public void run() {
                    //由于线程one先启动，下面这句话让它等一等线程two. 读着可根据自己电脑的实际性能适当调整等待时间.
                    //shortWait(100000);
                    a = 1;
                    x = b;
                }
            });
            Thread other = new Thread(new Runnable() {
                public void run() {
                    b = 1;
                    y = a;
                }
            });
            one.start();other.start();
            one.join();other.join();
            String result = "第" + i + "次 (" + x + "," + y + "）";
            if(x == 0 && y == 0) {
                System.err.println(result);
                break;
            } else {
                //System.out.println(result);
            }
        }
    }
    public static void shortWait(long interval){
        long start = System.nanoTime();
        long end;
        do{
            end = System.nanoTime();
        }while(start + interval >= end);
    }
}
```

假设指令重排不会发生，那么 `result` 将不会打印，实际情况是：循环 n 次之后会打印 `result`。

`volatile` 可以禁止指令重排。

![image-20200620174915155](http://oss.mflyyou.cn/blog/20200620174915.png?author=zhangpanqin)

大致简单理解，加了内存屏障之后，代码分成 1，2，3 部分。1 部分代码你怎么指令重排我不管，但是 1 部分代码执行完了之后，必须执行 2 部分代码，再执行 3 部分代码。

### 内存屏障

为了禁止 `编译器重排序 ` 和 `CPU 重排序`，在编译器和 CPU 层面都有对应的指令，也就是内存屏障（Memory Barrier）。
编译器的内存屏障，只是为了告诉编译器不要对指令进行重排序。当编译完成之后，这种内存屏障就消失了。

CPU 并不会感知到编译器中内存屏障的存在。而 CPU 的内存屏障是 CPU 提供的指令，可以由开发者显示调用。

CPU 内存屏障分成四种：

（1）`LoadLoad`：禁止读和读的重排序。

读 1 ; LoadLoad ; 读 2。LoadLoad 屏障确保读 1 和 读 2 排序。

（2）`StoreStore`：禁止写和写的重排序。

写 1; StoreStore; 写 2。StoreStore 屏障确保 `写1` 立刻刷新数据到主存，并保证别的线程中的数据失效的操作，不能和 `写 2` 进行重排序。

（3）`LoadStore`：禁止读和写的重排序。

读 1;LoadStore; 写 2。确保 `读 1` 操作先于 `写 2` 及其后所有的存储指令刷新数据到内存的操作。

（4）`StoreLoad`：禁止写和读的重排序。

写 1;StoreLoad;读 2。该屏障确保 `写 1` 立刻刷新数据到内存的操作先于 读 2 及其后续别的读。

这里只探讨为了实现 volatile 关键字的语义的一种参考做法：
（1）在 volatile 写操作的前面插入一个 `StoreStore` 屏障。保证 volatile 写操作不会和之前的写操作重排序。

（2）在 volatile 写操作的后面插入一个 `StoreLoad` 屏障。保证 volatile 写操作不会和之后的读操作重排序。

（3）在 volatile 读操作的前面插入一个 `LoadLoad` 屏障。保证 volatile 读操作不会和之前的读操作重排序。

（4）在 volatile 读操作的后面插入一个 `LoadStore` 屏障。保证 volatile 读操作不会和之后的写操作重排序。

#### volatile 写

```java
public class VolatileDemo2 {
    private static volatile int a = 1;

    public static void main(String[] args) {
        int b = 2;
        // StoreStore
        a = 2; // volatile 写
        // StoreLoad
        int c = b;
    }
}
```

b=2 赋值这个 store1 (写 1) 不能和 a=2 这个赋值 store2 (写 2) 操作重排序。

a =2 赋值这个 store2 (写 1) 不能和 c=b 这个 load1 (读 2) 重排序。

#### volatile 读

```java
public class VolatileDemo2 {
    private static volatile int a = 1;

    public static void main(String[] args) {
        int b = 1;
        int c = b;
        // LoadLoad
        int d = a; // volatile 读
        // LoadStore
        int e = 2;
    }
}
```

c=b 这个 load1(读 1) 不能和 d=a load2（读 2）重排序。

d=a load1（读 1）不能和 e=2 (写 2 ) 重排序。

#### 总结

volatile 的可见性是通过内存屏障实现的。volatile 修饰的变量只要修改了，别的线程读取到的就是最新的值。

JDK 1.8 开始也提供了 api 层面的内存屏障，供我们使用。

```java
public final class Unsafe {
    // load 是读 ,store 是写
    /**
     * 禁止 load 操作重排序。屏障前的load操作不能被重排序到屏障后，屏障后的load操作不能被重排序到屏障前
     * loadFence=LoadLoad+LoadStore
     * @since 1.8
     */
    public native void loadFence();

    /**
     * 禁止store操作重排序。屏障前的store操作不能被重排序到屏障后，屏障后的store操作不能被重排序到屏障前
     * storeFence=StoreStore+LoadStore
     * @since 1.8
     */
    public native void storeFence();

    /**
     * 禁止load、store操作重排序
     * fullFence=loadFence+storeFence+StoreLoad
     * @since 1.8
     */
    public native void fullFence();

}
```

```java
public class VolatileDemo {
    private static int a = 0;

    public static void main(String[] args) throws InterruptedException {
        new Thread(() -> {
            while (a == 0) {
                // 仅仅加了内存屏障，程序可以退出
                getUnSafe().loadFence();
            }
            System.out.println("退出程序");
        }, "线程 1").start();
        System.out.println("修改 a=1 之前");
        Thread.sleep(3000);
        a = 1;
        System.out.println("修改 a=1 之后");
    }

    public final static Unsafe getUnSafe() {
        try {
            // 获取 Unsafe 内部的私有的实例化单例对象
            Field field = Unsafe.class.getDeclaredField("theUnsafe");
            // 无视权限
            field.setAccessible(true);
            return (Unsafe) field.get(null);
        } catch (Exception e) {
            throw new RuntimeException("获取 unfafe 失败");
        }
    }
}
```

上述 demo 实际只增加了 `getUnSafe().loadFence();` 使用，就改变了运行效果。

### volatile 并不能保证原子性

```java
public class VolatileDemo3 {
    private static volatile int a = 0;

    private static final int count = 10;

    public static void main(String[] args) throws InterruptedException {
        final CountDownLatch count2 = new CountDownLatch(count);
        for (int i = 0; i < VolatileDemo3.count; i++) {
            new Thread(() -> {
                try {
                    Thread.sleep(500);
                    a ++;
                    count2.countDown();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }).start();
        }
        count2.await();
        System.out.println(a);
    }
}
```

最终打印的结果可能不是 10 。`a++` 不是一个原子操作。a++ 可以理解为

```java
int b=a;
a=b+1;
```

<font color=red>volatile 并不能保证原子性 </font>

## 单例模式

### 饿汉式

```java
public class SingletonDemo {
    private static final SingletonDemo INSTANCE = new SingletonDemo();
    private SingletonDemo() {
    }
    public static SingletonDemo getInstance() {
        return SingletonDemo.INSTANCE;
    }
}
```

一般项目中我们用这种用法即可，简单方便，也没谁闲着无聊利用反射给你打破单例。

### 懒汉式

饿汉式不管你用不用这个单例，只要类加载，单例就给你初始化好了。

有的人细节控，强迫症想节约那可怜的内存，当用到这个单例的时候单例再实例化。

```java
public class SingletonDemo1 {
    private SingletonDemo1() {
    }

    public static SingletonDemo1 getInstance() {
        System.out.println("SingletonDemo1Holder 类加载");
        return SingletonDemo1Holder.getInstance();
    }

    private static class SingletonDemo1Holder {
        private static final SingletonDemo1 INSTANCE = new SingletonDemo1();
        public static SingletonDemo1 getInstance() {
            return SingletonDemo1Holder.INSTANCE;
        }
    }

    public static void main(String[] args) throws InterruptedException {
        System.out.println(SingletonDemo1.getInstance());
        System.out.println(SingletonDemo1.getInstance());
    }
}
```

运行的时候加上这个 `-XX:+TraceClassLoading` 会打印加载的类。

![image-20200620182245333](http://oss.mflyyou.cn/blog/20200620182245.png?author=zhangpanqin)

从图中我们可以看到调用 `SingletonDemo1.getInstance()` 的时候，才加载的 `SingletonDemo1Holder` 类，再实例化单例，达到懒加载的要求。

#### DCL 实现单例

以上单例的实现看着没啥技术含量，下面介绍一下 `DCL` (Double-checked locking)，双重检查锁的实现，这也是面试会问到的点。

```java
public class SingletonDemo2 {
    // 考点在这里，要不要加 volitale ？？？
    private volatile static SingletonDemo2 INSTANCE;
    private SingletonDemo2() {

    }
    public static SingletonDemo2 getInstance() {
        if (INSTANCE == null) {
            synchronized (SingletonDemo2.class) {
                if (INSTANCE == null) {
                    // 对象实例化
                    INSTANCE = new SingletonDemo2();
                }
            }
        }
        return INSTANCE;
    }
}
```

对象实例化实际可以简单理解为以下几个步骤：

1、分配对象空间

2、初始化对象

3、将对象指向分配的内存空间

当指令重排的时候，2 和 3 会进行重排序，导致有的线程可能拿到未初始化的对象调用，存在风险问题。

## 伪共享

`volatile` 给我们带来了变量 `可见性` 的功能，但是当使用不当，会掉入另一个 `伪共享` 的坑。先看 demo.

```java
public class VolatileDemo3 {
    private static volatile Demo[] demos = new Demo[2];
//    @sun.misc.Contended
    private static final class Demo {
        private volatile long x = 0L;
    }
    static {
        demos[0] = new Demo();
        demos[1] = new Demo();
    }
    public static void main(String[] args) throws InterruptedException {
        Thread thread1 = new Thread(() -> {
            for (long i = 0; i < 10000_0000L; i++) {
                demos[0].x = i;
            }
        });
        Thread thread = new Thread(() -> {
            for (long i = 0; i < 10000_0000L; i++) {
                demos[1].x = i;
            }
        });
        long start = System.nanoTime();
        thread.start();
        thread1.start();
        thread.join();
        thread1.join();
        long end = System.nanoTime();
        long runSecond = (end - start) / 100_0000;
        System.out.println("运行毫秒:" + runSecond);
    }
}
```

上述代码，存在伪共享的情况，我电脑运行 `运行毫秒:2764`

```java
// 运行的时候，需要加上参数 -XX:-RestrictContended
public class VolatileDemo3 {
    private static volatile Demo[] demos = new Demo[2];
    @sun.misc.Contended
    private static final class Demo {
        private volatile long x = 0L;
    }
    static {
        demos[0] = new Demo();
        demos[1] = new Demo();
    }
    public static void main(String[] args) throws InterruptedException {
        Thread thread1 = new Thread(() -> {
            for (long i = 0; i < 10000_0000L; i++) {
                demos[0].x = i;
            }
        });
        Thread thread = new Thread(() -> {
            for (long i = 0; i < 10000_0000L; i++) {
                demos[1].x = i;
            }
        });
        long start = System.nanoTime();
        thread.start();
        thread1.start();
        thread.join();
        thread1.join();
        long end = System.nanoTime();
        long runSecond = (end - start) / 100_0000;
        System.out.println("运行毫秒:" + runSecond);
    }
}
```

上述代码，使用 `@sun.misc.Contended` 避免伪共享，我电脑运行 `运行毫秒:813`

相似的用法在 `ConcurrentHashMap` 可以看到，

```java
@sun.misc.Contended
static final class CounterCell {
    volatile long value;
    CounterCell(long x) { value = x; }
}
```

上述代码展示了伪共享会降低代码的运行速度。什么是伪共享呢。

还记得 Cpu 中的 `L1` `L2` `L3` 吗，主存中的数据加载到 Cpu 的高速缓存的最小单位就是 `缓存行`（64 bit）。Cpu 的缓存失效，也是以缓存行为单位失效。

当 `Cpu` 从内存加载数据的时候，它会把可能会用到的数据和目标数据一起加载到 `L1/L2/L3` 中。上述代码的变量 ` private static volatile Demo[] demos = new Demo[2];` 这两个变量被一起加载到同一个缓存行中去了，一个线程修改了其中的 ` demos[0].x` 导致缓存行失效，另一个线程修改 `demos[1].x = i;` 的时候发现缓存行失效，会去主存重新加载新的数据，两个线程相互影响导致不停从内存加载，运行速度自然降低了。

`@sun.misc.Contended` 作用就是让 ` demos[0]` 和 ` demos[1]` 分配在不同的缓存行中去。

我们也可以通过对齐填充，而避免伪共享。

`缓存行` 通常都是 64 bit。而 long 为 8 个 bit，我们自己补充 7 个没有用 long 变量就可以让 x 和 7 个没用的变量单独一个缓存行

```java
public class VolatileDemo3 {
    private static volatile Demo[] demos = new Demo[2];
    private static final class Demo {
        private volatile long x = 0L;
        // 缓存行对齐填充的无用数据
        private volatile long pading1, pading2, pading3, pading4, pading5, pading6, pading7;
    }
    static {
        demos[0] = new Demo();
        demos[1] = new Demo();
    }

    public static void main(String[] args) throws InterruptedException {
        Thread thread1 = new Thread(() -> {
            for (long i = 0; i < 10000_0000L; i++) {
                demos[0].x = i;
            }
        });
        Thread thread = new Thread(() -> {
            for (long i = 0; i < 10000_0000L; i++) {
                demos[1].x = i;
            }
        });
        long start = System.nanoTime();
        thread.start();
        thread1.start();
        thread.join();
        thread1.join();
        long end = System.nanoTime();
        long runSecond = (end - start) / 100_0000;
        System.out.println("运行毫秒:" + runSecond);
    }


}
```
