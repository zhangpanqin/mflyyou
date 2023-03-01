---
title: java中强软弱虚引用的妙用
---

## 前言

`ThreadLocal` 在什么情况下可能发生内存泄漏？如果你想清楚这个问题的来龙去脉，看源码是必不可少的，看了源码之后你发现，实际 `ThreadLocal` 中实际用到 `static class Entry extends WeakReference<ThreadLocal<?>> {}` ,谜底实际就是使用了弱引用 `WeakReference`。

本文内容概要

-   强引用：Object o = new Object()
-   软引用：new SoftReference(o);
-   弱引用：new WeakReference(o);
-   虚引用：new PhantomReference(o);
-   ThreadLocal 的使用，及使用不当发生内存泄漏的原因

Jdk 1.2 增加了抽象类 `Reference` 和 `SoftReference`、`WeakReference`、`PhantomReference`，扩展了引用类型分类，达到对内存更细粒度的控制。

比如我们的缓存数据，当内存不够用的时候，我希望缓存可以释放内存，或者将缓存存入到堆外等。

但我们怎么区分哪些对象需要回收（垃圾回收算法，可达性分析），回收的时候可以让我们拿到回收的通知，所以 JDK 1.2 带来这几个引用类型。

| 引用类型                 | 什么时候回收                                                                                                   |     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- | --- |
| 强引用                   | 强引用的对象，只要 GC root 可达，不会被回收，内存不够用了，会抛出 oom                                          |     |
| 软引用：SoftReference    | 软引用对象，GC root 中，只有软引用可以到达某个对象 a，在 oom 之前，垃圾回收会回收对象 a                        |     |
| 弱引用：WeakReference    | 弱引用，GC root 中，只有弱引用可以到达某个对象 c，发生 gc 就会被回收掉 c                                       |     |
| 虚引用：PhantomReference | 虚引用，必须配合 ReferenceQueue 使用，什么时候回收不知道，但回收之后，可以操作 ReferenceQueue 获取被回收的引用 |     |

## 强引用

强引用就是我们经常用到的方式：Object o = new Object()。垃圾回收时，强引用的变量是不会被回收，只有设置 o=null，jvm 通过可达性分析，没有 GC root 到达对象，垃圾回收器才会清理堆中的对象，释放内存。 当继续申请内存分配，就会 oom。

定义一个类 Demo，Demo 实例占用内存大小为 10m，不停往 list 添加 Demo 的示例，由于不能申请到内存分配，程序抛出 oom 终止

```java
// -Xmx600m
public class SoftReferenceDemo {
    // 1m
    private static int _1M = 1024 * 1024 * 1;
    public static void main(String[] args) throws InterruptedException {
        ArrayList<Object> objects = Lists.newArrayListWithCapacity(50);
        int count = 1;
        while (true) {
            Thread.sleep(100);
            // 获取 jvm 空闲的内存为多少 m
            long meme_free = Runtime.getRuntime().freeMemory() / _1M;
            if ((meme_free - 10) >= 0) {
                Demo demo = new Demo(count);
                objects.add(demo);
                count++;
                demo = null;
            }
            System.out.println("jvm 空闲内存" + meme_free + " m");
            System.out.println(objects.size());
        }
    }

    @Data
    static class Demo {
        private byte[] a = new byte[_1M * 10];
        private String str;
        public Demo(int i) {
            this.str = String.valueOf(i);
        }
    }
}
```

以上代码运行结果，抛出 oom 程序停止

```java
jvm 空闲内存41 m
54
Exception in thread "main" java.lang.OutOfMemoryError: Java heap space
	at com.fly.blog.ref.SoftReferenceDemo$Demo.<init>(SoftReferenceDemo.java:37)
	at com.fly.blog.ref.SoftReferenceDemo.main(SoftReferenceDemo.java:25)
```

但是有的业务场景，需要我们在内存不够用，可以释放掉一些不必要的数据。比如我们在缓存中存的用户信息。

## 软引用

jdk 从 1.2 开始加入了 `Reference` ,`SoftReference` 是其中一个分类，它的作用是，通过 GC root 到达对象 a，仅有 `SoftReference` ，对象 a 将会在 jvm oom 之前，被 jvm gc 释放掉。

无限循环往 `List` 添加 `10m` 左右大小的数据（SoftReference），发现没有出现 oom。

```java
// -Xmx600m
public class SoftReferenceDemo {
    // 1m
    private static int _1M = 1024 * 1024 * 1;
    public static void main(String[] args) throws InterruptedException {
        ArrayList<Object> objects = Lists.newArrayListWithCapacity(50);
        int count = 1;
        while (true) {
            Thread.sleep(500);
            // 获取 jvm 空闲的内存为多少 m
            long meme_free = Runtime.getRuntime().freeMemory() / _1M;
            if ((meme_free - 10) >= 0) {
                Demo demo = new Demo(count);
                SoftReference<Demo> demoSoftReference = new SoftReference<>(demo);
                objects.add(demoSoftReference);
                count++;
                // demo 为 null,只有 demoSoftReference 一条引用到达 Demo 的实例，GC 将会在 oom 之前回收 Demo 的实例
                demo = null;
            }
            System.out.println("jvm 空闲内存" + meme_free + " m");
            System.out.println(objects.size());
        }
    }
    @Data
    static class Demo {
        private byte[] a = new byte[_1M * 10];
        private String str;
        public Demo(int i) {
            this.str = String.valueOf(i);
        }
    }
}
```

![image-20200625213429845](http://oss.mflyyou.cn/blog/20200625213429.png?author=zhangpanqin)

通过 `jvisualvm` 查看 jvm 堆的使用，可以看到堆在要溢出的时候就会回收掉，空闲的内存很大的时候，你主动执行 `执行垃圾回收`，内存是不会回收的。

## 弱引用

对象 demo 的引用只有 `WeakReference` 可达时，会在 gc 之后回收 demo 释放掉内存。

以下程序也会一直不停的运行，只是内存释放的时机不同而已

```java
// -Xmx600m -XX:+PrintGCDetails
public class WeakReferenceDemo {
    // 1m
    private static int _1M = 1024 * 1024 * 1;

    public static void main(String[] args) throws InterruptedException {
        ArrayList<Object> objects = Lists.newArrayListWithCapacity(50);
        int count = 1;
        while (true) {
            Thread.sleep(100);
            // 获取 jvm 空闲的内存为多少 m
            long meme_free = Runtime.getRuntime().freeMemory() / _1M;
            if ((meme_free - 10) >= 0) {
                Demo demo = new Demo(count);
                WeakReference<Demo> demoWeakReference = new WeakReference<>(demo);
                objects.add(demoWeakReference);
                count++;
                demo = null;
            }
            System.out.println("jvm 空闲内存" + meme_free + " m");
            System.out.println(objects.size());
        }
    }

    @Data
    static class Demo {
        private byte[] a = new byte[_1M * 10];
        private String str;
        public Demo(int i) {
            this.str = String.valueOf(i);
        }
    }
}
```

运行结果，`SoftReference` 可用内存在快用尽的时候就会释放掉内存，而 `WeakReference` 每次可用内存达到 `360m` 左右会进行垃圾，而释放掉内存

```txt
[GC (Allocation Failure) [PSYoungGen: 129159K->1088K(153088K)] 129175K->1104K(502784K), 0.0007990 secs] [Times: user=0.00 sys=0.00, real=0.00 secs]
jvm 空闲内存364 m
36
jvm 空闲内存477 m
```

## 虚引用

也有称呼为 `幻灵引用`，因为你不知道什么时候被回收，所需必须配合 `ReferenceQueue`，当对象回收时，可以从这个队列拿到 PhantomReference 的实例。

```java
// -Xmx600m -XX:+PrintGCDetails
public class PhantomReferenceDemo {
    // 1m
    private static int _1M = 1024 * 1024 * 1;

    private static ReferenceQueue referenceQueue = new ReferenceQueue();

    public static void main(String[] args) throws InterruptedException {
        ArrayList<Object> objects = Lists.newArrayListWithCapacity(50);
        int count = 1;
        new Thread(() -> {
            while (true) {
                try {
                    Reference remove = referenceQueue.remove();
                    // objects 可达性分析，可以到达 PhantomReference<Demo>，内存是不能及时释放的，我们需要在队里中拿到那个 Demo 被回收了，然后
                    // 从 objects 移除这个对象
                    if (objects.remove(remove)) {
                        System.out.println("移除元素");
                    }
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }).start();
        while (true) {
            Thread.sleep(500);
            // 获取 jvm 空闲的内存为多少 m
            long meme_free = Runtime.getRuntime().freeMemory() / _1M;
            if ((meme_free - 10) > 40) {
                Demo demo = new Demo(count);
                PhantomReference<Demo> demoWeakReference = new PhantomReference<>(demo, referenceQueue);
                objects.add(demoWeakReference);
                count++;
                demo = null;
            }
            System.out.println("jvm 空闲内存" + meme_free + " m");
            System.out.println(objects.size());
        }
    }

    @Data
    static class Demo {
        private byte[] a = new byte[_1M * 10];
        private String str;

        public Demo(int i) {
            this.str = String.valueOf(i);
        }
    }
}
```

## ThreadLocal

`ThreadLocal` 在我们实际开发中，用的还是比较多的。那它到底是个什么东东呢（线程本地变量），我们知道 `局部变量` （方法内定义的变量）和 `成员变量` (类的属性)。

有的时候呢，我们希望一个变量的生命周期可以贯穿整个线程的一个任务运行周期（线程池中的线程可以分配执行不同的任务），在各个方法调用的时候我们可以拿到这个预先设置的变量，这就是 `ThreadLocal` 的作用。

比如我们想要拿到当前请求的 `HttpServletRequest`，然后在当前各个方法都可以获取到，`SpringBoot` 已经帮我们封装好了，`RequestContextFilter` 在每个请求过来之后，都会通过 `RequestContextHolder` 设置`线程本地变量`，原理就是操作 `ThreadLocal`。

ThreadLocal 只是针对当前线程中的调用，跨线程调用是不行的，所以 Jdk 通过 `InheritableThreadLocal` 继承 `ThreadLocal` 来实现。

### ThreadLocal 获取当前请求的用户信息

看注释大致就能明白 `TheadLocal` 怎么使用了

```java
/**
 * @author 张攀钦
 * @date 2018/12/21-22:59
 */
@RestController
public class UserInfoController {
    @RequestMapping("/user/info")
    public UserInfoDTO getUserInfoDTO() {
        return UserInfoInterceptor.getCurrentRequestUserInfoDTO();
    }
}

@Slf4j
public class UserInfoInterceptor implements HandlerInterceptor {
    private static final ThreadLocal<UserInfoDTO> THREAD_LOCAL = new ThreadLocal();
    // 请求头用户名
    private static final String USER_NAME = "userName";
    // 注意这个，只有注入到 ioc 中的 bean,才能注入进来
    @Autowired
    private IUserInfoService userInfoService;
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 判断是不是接口请求
        if (handler instanceof HandlerMethod) {
            String userName = request.getHeader(USER_NAME);
            UserInfoDTO userInfoByUserName = userInfoService.getUserInfoByUserName(userName);
            THREAD_LOCAL.set(userInfoByUserName);
            return true;
        }
        return false;
    }
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        // 用完之后记得释放掉内存
        THREAD_LOCAL.remove();
    }
    // 获取当前线程设置的用户信息
    public static UserInfoDTO getCurrentRequestUserInfoDTO() {
        return THREAD_LOCAL.get();
    }
}

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    /**
     * 将 UserInfoInterceptor 注入到 ioc 容器中
     */
    @Bean
    public UserInfoInterceptor getUserInfoInterceptor() {
        return new UserInfoInterceptor();
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 调用这个方法返回的就是 ioc 的 bean
        registry.addInterceptor(getUserInfoInterceptor()).addPathPatterns("/**");
    }
}
```

### InheritableThreadLocal

有的时候，我们希望当前线程的局部变量的生命周期可以延伸到`子线程` 中，父线程设置的变量，在子线程拿到。 `InheritableThreadLocal` 就是提供了这个能力。

```java
/**
 * @author 张攀钦
 * @date 2020-06-27-21:18
 */
public class InheritableThreadLocalDemo {
    static InheritableThreadLocal<String> INHERITABLE_THREAD_LOCAL = new InheritableThreadLocal();
    static ThreadLocal<String> THREAD_LOCAL = new ThreadLocal<>();
    public static void main(String[] args) throws InterruptedException {
        INHERITABLE_THREAD_LOCAL.set("父线程中使用 InheritableThreadLocal 设置变量");
        THREAD_LOCAL.set("父线程中使用 ThreadLocal 设置变量");
        Thread thread = new Thread(
                () -> {
                    // 能拿到设置的变量
                    System.out.println("从 InheritableThreadLocal 拿父线程设置的变量: " + INHERITABLE_THREAD_LOCAL.get());
                    // 打印为 null
                    System.out.println("从 ThreadLocal 拿父线程设置的变量: " + THREAD_LOCAL.get());
                }
        );
        thread.start();
        thread.join();
    }
}
```

### ThreadLocal get 方法源码分析

你可以理解 Thead 对象有个属性 Map，它的 key 是 `ThreadLoal` 实例，获取线程局部变量的源码

```java
public class ThreadLocal<T> {
    public T get() {
        // 获取运行在那个线程中
        Thread t = Thread.currentThread();
        // 从 Thread 拿 Map
        ThreadLocalMap map = getMap(t);
        if (map != null) {
            // 使用 ThreadLocal 实例从 Map 获取值
            ThreadLocalMap.Entry e = map.getEntry(this);
            if (e != null) {
                @SuppressWarnings("unchecked")
                T result = (T)e.value;
                return result;
            }
        }
        // 初始化 Map,并返回初始化值，默认为 null，你可以定义方法，从这个方法加载初始化值
        return setInitialValue();
    }
}
```

### InheritableThreadLocal 获取父线程设置的数据分析

每个 Thread 还有一个 Map 属性为 inheritableThreadLocals，用于保存从父线程复制过来的 value 。

当初始化子线程的时候，它会将父线程的 Map (inheritableThreadLocals) 的值复制到自己的 Thead Map (inheritableThreadLocals)过来，每个线程维护自己的 inheritableThreadLocals， 所以子线程改不了父线程维护的数据，只是子线程可以获得父线程设置的数据。

```java
public class Thread{

	// 维护线程本地变量
    ThreadLocal.ThreadLocalMap threadLocals = null;

    // 维护可以子线程可以继承的父线程的数据
    ThreadLocal.ThreadLocalMap inheritableThreadLocals = null;

   // 线程初始化
    public Thread(ThreadGroup group, Runnable target, String name,
                  long stackSize) {
        init(group, target, name, stackSize);
    }

    private void init(ThreadGroup g, Runnable target, String name,
                      long stackSize, AccessControlContext acc,
                      boolean inheritThreadLocals) {
        if (inheritThreadLocals && parent.inheritableThreadLocals != null){
            // 将父线程的 inheritableThreadLocals 数据复制到子线程中去
            this.inheritableThreadLocals = ThreadLocal.createInheritedMap(parent.inheritableThreadLocals);
        }
    }
}

public class TheadLocal{
    static ThreadLocalMap createInheritedMap(ThreadLocalMap parentMap) {
        /// 创建自己线程的 Map,将父线程的值复制进去
        return new ThreadLocalMap(parentMap);
    }

    static class ThreadLocalMap {
        private ThreadLocalMap(ThreadLocalMap parentMap) {
            Entry[] parentTable = parentMap.table;
            int len = parentTable.length;
            setThreshold(len);
            table = new Entry[len];
            // 遍历父线程，将数据复制过来
            for (int j = 0; j < len; j++) {
                Entry e = parentTable[j];
                if (e != null) {
                    @SuppressWarnings("unchecked")
                    ThreadLocal<Object> key = (ThreadLocal<Object>) e.get();
                    if (key != null) {
                        Object value = key.childValue(e.value);
                        Entry c = new Entry(key, value);
                        int h = key.threadLocalHashCode & (len - 1);
                        while (table[h] != null)
                            h = nextIndex(h, len);
                        table[h] = c;
                        size++;
                    }
                }
            }
        }
    }
}
```

demo 验证，以上分析

![image-20200627232351534](http://oss.mflyyou.cn/blog/20200627232351.png?author=zhangpanqin)

![image-20200627225502636](http://oss.mflyyou.cn/blog/20200627225502.png?author=zhangpanqin)

### 内存泄漏原因

定义了一个 20 大小的线程池，执行 50 次任务,执行完之后，将 `threadLocal` 置为 null，模拟内存泄漏的场景 。为了排除干扰因素，我设置 jvm 参数为 `-Xms8g -Xmx8g -XX:+PrintGCDetails`

```java
public class ThreadLocalDemo {
    private static ExecutorService executorService = Executors.newFixedThreadPool(20);
    private static ThreadLocal threadLocal = new ThreadLocal();

    public static void main(String[] args) throws InterruptedException {
        for (int i = 0; i < 50; i++) {
            executorService.submit(() -> {
                try {
                    threadLocal.set(new Demo());
                    Thread.sleep(50);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } finally {
                    if (Objects.nonNull(threadLocal)) {
                        // 为防止内存泄漏,当前线程用完,清除掉 value
//                        threadLocal.remove();
                    }
                }
            });
        }
        Thread.sleep(5000);
        threadLocal = null;
        while (true) {
            Thread.sleep(2000);
        }
    }
    @Data
    static class Demo {
        //
        private Demo[] demos = new Demo[1024 * 1024 * 5];
    }
}
```

运行程序，没有打印 gc 日志，说明没有进行垃圾回收

![image-20200628020439866](http://oss.mflyyou.cn/blog/20200628020439.png?author=zhangpanqin)

![image-20200628020512394](http://oss.mflyyou.cn/blog/20200628020512.png?author=zhangpanqin)

在 `Java VisualVM` 中我们 `执行垃圾回收`，回收之后的内存分布，这个 20 个 `ThreadLocalDemo$Demo[]` 是回收不了的，这就是内存泄漏。

![image-20200628020811328](http://oss.mflyyou.cn/blog/20200628020811.png?author=zhangpanqin)

程序循环 50 次创建了 50 个 `Demo` ，程序运行期间是不会触发垃圾回收（设置 jvm 参数保证的），所以 `ThreadLocalDemo$Demo[]` 存活的实例数为 `50`。

当我手动触发了 `GC`，实例数降为 20，并不是我们期望的 0，这就是程序发生了内存泄漏问题

为什么发生了内存泄漏呢？

因为每个线程对应一个` Thread`，线程池大小为 20 个。`Thread` 中有 `ThreadLocal.ThreadLocalMap threadLocals = null;`

`ThreadLocalMap` 中有 `Entry[] tables`，k 为弱引用。当我们将 threadLocal 置为 null 的时候，GC ROOT 到 `ThreadLocalDemo$Demo[]` 引用链还是存在的，只是 k 回收掉了，value 依然存在的，tables 长度是不会变的，是不会被回收的。

![image-20200628023936332](http://oss.mflyyou.cn/blog/20200628023936.png?author=zhangpanqin)

ThreadLocal 在`set` 和 `get` 的时候，针对 k 为 null 的情况做了优化，会将对应的 tables[i] 设置为 null。这样单个 Entry 就可以被回收了。但是我们将 ThreadLocal 置为 null 之后，不能操作方法调用了。只能等到 Thread 再次调用别的 `ThreadLocal` 时操作 `ThreadLocalMap` 时根据条件判断，进行 Map 的 rehash,将 k 为 null 的 Entry 删除掉。

上述问题解决也比较方便，线程使用完 `线程局部变量`，调用 `remove` 主动清除 `Entry` 就可以了。
