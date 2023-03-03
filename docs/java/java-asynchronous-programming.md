---
title: java 异步编程
---

## 前言

在 java 中你不了解异步编程，crud 完全没有问题，但是有的需求你无法优雅的实现。

js 也存在异步编程，当你理解了用同步的思维编写异步的代码时，相信你在编程上的造诣又更进一步。

大多人都在追捧微服务，可能他们只会用 `Ribbon` 和 `Feign`。微服务是一个架构上的选择，当你没有达到架构层次时，我认为你应该更加注重业务上的代码编写，即微服务中单体服务代码的编写。

单体服务性能极差，你的微服务整体性能也好不到哪里去，只能通过限流、熔断外加多部署机器来解决并发低的问题。在你想玩微服务之前，并发玩好了再考虑高并发。先把 java 中 juc 包下的并发相关的知识整的明明白白再进行下一步，这花不了几个时间。微服务是你进阶之后再学的。

本来打算继续写 Mysql，但实在提不起来我的兴致（还需要看书研究，毕竟是个黑盒研究），只好拿这篇完成任务了。

### 本文内容

-   js 中 Promise 和 async await 的一个列子
-   SpringBoot 中异步编程
-   Future
-   CompletableFuture

## js 异步编程

要习惯使用 Promise ，避免把 fn 当成参数传递，避免回调地狱。这不仅仅是 api 调用的问题，这是你编程思想转变。

```js
const awaitFunc = function _awaitFunc() {
    return Promise.resolve("awaitFunc").then((data) => {
        console.log(data);
        return "awaitFunc-then-return-data";
    });
};

const async = async function _async() {
    setTimeout(() => {
        console.log("验证加入了宏任务队列---1");
    }, 0);
    // 加不加 await 有什么区别？
    await awaitFunc().then((data) => {
        console.log(data);
        setTimeout(() => {
            console.log("验证加入了宏任务队列---2");
        }, 0);
    });
    console.log("awaitFunc 执行完在打印");
};
async();
```

## SpringBoot 中异步编程

在 SpringBoot `@EnableAsync` 和 `@Async` 就可以助你异步编程。底层原理就是 `ThreadPoolExecutor` 和 `Future` 的封装。

<img src="http://oss.mflyyou.cn/blog/20201108120510.png?author=zhangpanqin" alt="1583165-20200710095540896-1284477865" style="zoom: 33%;" />

我们拿这个烧水举例子，当你同步串行执行，需要消耗 20 分钟。同步编程思维模型较简单，容易实现。

当你多线程异步执行，只需要消耗 16 分钟。异步编程思维模型稍微复杂一点，多线程之间通信异步转同步是一个挑战。

```java
@GetMapping("/tea/async")
public RetUtil makeTeaAsync() throws InterruptedException, ExecutionException {
    // Stopwatch 用于计算代码执行时间
    final Stopwatch started = Stopwatch.createStarted();
    final Future asyncResult = makeTeaService.boilWater();
    final Future asyncResult1 = makeTeaService.washTeaCup();
    asyncResult.get();
    asyncResult1.get();
    final long elapsed = started.elapsed(TimeUnit.SECONDS);
    String str = StrUtil.format("任务执行了 {} 秒", elapsed);
    final MakeTeaVO makeTeaVO = new MakeTeaVO();
    makeTeaVO.setMessage(str);
    return RetUtil.success(makeTeaVO);
}

@Service
public class IMakeTeaServiceImpl implements IMakeTeaService {
    @Override
    @Async
    public AsyncResult<String> boilWater() throws InterruptedException {
        System.out.println("洗水壶");
        TimeUnit.SECONDS.sleep(1);
        System.out.println("烧开水");
        TimeUnit.SECONDS.sleep(15);
        return new AsyncResult("洗水壶->烧开水");
    }

    @Override
    @Async
    public AsyncResult<String> washTeaCup() throws InterruptedException {
        System.out.println("洗茶杯");
        System.out.println("洗茶壶");
        System.out.println("拿茶叶");
        TimeUnit.SECONDS.sleep(4);
        return new AsyncResult("洗茶杯,洗茶壶,拿茶叶");
    }
}
```

`AsyncResult` 是 `Future` 的实现类，当调用 `Future.get` 会阻塞等待结果的返回。`@Async` 也可以指定在那个线程池中执行任务。

```java
final Future asyncResult = makeTeaService.boilWater();
final Future asyncResult1 = makeTeaService.washTeaCup();
asyncResult.get();
asyncResult1.get();
```

这个 Demo 的实现，需要调用两次 Furute.get() 算是个不优雅的实现。

```java
@Override
public String makeTea() throws InterruptedException {
    final CountDownLatch count = new CountDownLatch(2);
    THREAD_POOL_EXECUTOR.execute(() -> {
        System.out.println("洗水壶");
        System.out.println("烧开水");
        try {
            TimeUnit.SECONDS.sleep(16);
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            count.countDown();
        }
    });
    THREAD_POOL_EXECUTOR.execute(() -> {
        System.out.println("洗茶杯");
        System.out.println("洗茶壶");
        System.out.println("拿茶叶");
        try {
            TimeUnit.SECONDS.sleep(4);
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            count.countDown();
        }
    });
    count.await();
    System.out.println("泡茶");
    return "";
}
@GetMapping("/tea/async2")
public RetUtil makeTeaAsync2() throws InterruptedException, ExecutionException {
    final Stopwatch started = Stopwatch.createStarted();
    makeTeaService.makeTea();
    final long elapsed = started.elapsed(TimeUnit.SECONDS);
    String str = StrUtil.format("任务执行了 {} 秒", elapsed);
    final MakeTeaVO makeTeaVO = new MakeTeaVO();
    makeTeaVO.setMessage(str);
    return RetUtil.success(makeTeaVO);
}
```

使用 `CountDownLatch` 将异步代码转换为同步返回，这只是另一个实现

## Future

```java
public interface Future<V> {
    /**
     * 尝试取消这个任务的执行.
     * 如果任务执行完成之后,调用 cancel 返回 false.
     * 如果任务已经被取消了,调用 cancel 也会返回 false
     *
     * 如果任务已经执行了, mayInterruptIfRunning 标志是否中断执行任务的线程.
     * mayInterruptIfRunning 为 true 会触发线程的中断(当线程睡眠,会抛出异常 InterruptedException),
     * 为 false 时不中断任务执行,只改变 Future 的状态
     *
     * 调用了 cancel 方法,调用 get 方法会抛出异常
     */
    boolean cancel(boolean mayInterruptIfRunning);

    /**
     * 任务完成之前调用 cancel ,此方法返回 true
     */
    boolean isCancelled();

    /**
     * 任务完成返回 true
     */
    boolean isDone();

    /**
     * 等待任务完成,然后返回其结果
     * @return the computed result
     * @throws CancellationException if the computation was cancelled
     * @throws ExecutionException    if the computation threw an    exception
     * @throws InterruptedException  if the current thread was interrupted while waiting
     */

    V get() throws InterruptedException, ExecutionException;
    /**
     * 等待任务完成,然后返回其结果.超时没有返回，抛出异常 TimeoutException
     */
    V get(long timeout, TimeUnit unit) throws InterruptedException, ExecutionException, TimeoutException;
}
```

`Future.cancel(true)` 会触发线程休眠的中断，即 ` TimeUnit.SECONDS.sleep(10);` 会抛出异常。

`Future.cancel(true)` 或者 `Future.cancel(false)` 都会触发 `Future.get()` 异常。

```java
public static void main(String[] args) throws ExecutionException, InterruptedException {
    final Future<String> submit = THREAD_POOL_EXECUTOR.submit(() -> {
        System.out.println("任务开始执行");
        try {
            TimeUnit.SECONDS.sleep(10);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("任务执行完毕");
        return "ok";
    });

    THREAD_POOL_EXECUTOR.execute(() -> {
        System.out.println("执行 submit.cancel");
        try {
            TimeUnit.SECONDS.sleep(2);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        submit.cancel(false);
    });

    // submit.get();
    System.out.println("整个流程执行结束");
}
```

JDK 提供 `Future` 的实现 `FutureTask` 源码相对较简单，不再展开。

## CompletableFuture

由于 `Future` 使用的局限性：不能链式调用、多个异步计算的结果不能传递下一个异步任务（可以做到，但是编程稍微复杂），异步执行异常的捕获处理

从 `JDK 1.8` 开始，大佬 `Doug Lea` 带来了更加容易的异步编程模型，CompletableFuture。

CompletableFuture 可以做到

1、获取异步执行的结果链式传递下一个异步去执行

2、异步执行时，你有机会处理异步执行时发生的异常

总之，`CompletableFuture` 很想。

`CompletableFuture` 实现比较复杂，有的地方不是那么容易理解，当你理解其实现思想，你也算是一只脚迈入了响应式编程中去了。

### 开胃小菜

```java
public class CompletableFutureBlog1 {
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        final Stopwatch started = Stopwatch.createStarted();

        // 洗水壶,烧水
        CompletableFuture<String> completableFuture1 = CompletableFuture.supplyAsync(() -> {
            System.out.println("洗水壶");
            System.out.println("烧水");
            try {
                TimeUnit.SECONDS.sleep(16);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return "洗水壶 -> 烧水";
        });

        // 洗茶壶,洗茶杯 -> 拿茶叶
        CompletableFuture<String> completableFuture2 =
                CompletableFuture.supplyAsync(() -> {
                System.out.println("洗茶壶");
                System.out.println("洗茶杯");
                System.out.println("拿茶叶");
                try {
                    TimeUnit.SECONDS.sleep(4);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                return "洗茶壶,洗茶杯 -> 拿茶叶";
            });

        // 组合二者异步运算的结果,传递给方法计算
        final CompletableFuture<String> completableFuture = completableFuture2.thenCombine(completableFuture1, (result2, result1) -> {

            System.out.println(StrUtil.format("result2 是 洗茶壶,洗茶杯 -> 拿茶叶: {}", result2));
            System.out.println(StrUtil.format("result1 是 洗水壶 -> 烧水: {}", result1));


            System.out.println("泡茶");
            return "泡茶";
        });
        completableFuture.get();
        System.out.println("执行时间: " + started.elapsed(TimeUnit.SECONDS));
    }
}
```

### runAsync 和 supplyAsync 的区别

`runAsync` 和 `supplyAsync ` 区别就是你是否需要获取异步计算的结果。当你需要异步处理的结果，你需要 `supplyAsync`

```java
public class CompletableFutureBlog2 {
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        final Stopwatch started = Stopwatch.createStarted();

        final CompletableFuture<Integer> ret = CompletableFuture.supplyAsync(() -> {
            System.out.println("开始进行耗时的异步计算,消耗 3 秒");
            try {
                TimeUnit.SECONDS.sleep(3);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return 10;
        });
        final Integer integer = ret.get();

        System.out.println(StrUtil.format("异步执行的结果: {}", integer));

        System.out.println("执行时间: " + started.elapsed(TimeUnit.SECONDS));
    }
}
```

### `thenApplyAsync` 、`thenAcceptAsync` 和 `thenRunAsync`

`thenXX` 都是为了在上一个异步计算的结束之后执行。

我们对异步计算的结果分为以下几个情况：

-   需要依赖异步计算的结果，并且依赖异步计算的结果计算返回另个一个结果 `thenApplyAsync`

-   依赖异步计算的结果，但是不会产生新的结果，`thenAcceptAsync`

-   不依赖计算计算的结果，并且没有返回值 `thenRunAsync`

```java
public class CompletableFutureBlog3 {
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        final Stopwatch started = Stopwatch.createStarted();

        final CompletableFuture<Integer> ret = CompletableFuture.supplyAsync(() -> {
            System.out.println("开始进行耗时的异步计算,消耗 3 秒");
            try {
                TimeUnit.SECONDS.sleep(3);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return 10;
        });

        final Integer result = ret.thenApplyAsync(data -> {
            System.out.println("依赖上一个异步计算,消耗 5 秒");
            try {
                TimeUnit.SECONDS.sleep(5);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return data + 12;
        }).get();

        System.out.println(StrUtil.format("异步执行的结果: {}", result));

        System.out.println("执行时间: " + started.elapsed(TimeUnit.SECONDS));
    }
}
```

### `thenCombineAsync`

结合另一个 `CompletableFuture` 异步计算，当两个异步计算执行完了，执行回调。

计算一个耗时的计算。将这个耗时计算拆成两个耗时的异步计算，当两个异步计算结束，在合并最终的结果

```java
public class CompletableFutureBlog4 {
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        final Stopwatch started = Stopwatch.createStarted();

        final CompletableFuture<Integer> ret1 = CompletableFuture.supplyAsync(() -> {
            System.out.println("开始进行耗时的异步计算,消耗 3 秒");
            try {
                TimeUnit.SECONDS.sleep(3);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return 10;
        });
        final CompletableFuture<Integer> ret2 = CompletableFuture.supplyAsync(() -> {
            System.out.println("开始进行耗时的异步计算,消耗 5 秒");
            try {
                TimeUnit.SECONDS.sleep(5);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return 10;
        });

        final CompletableFuture<Integer> integerCompletableFuture = ret2.thenCombineAsync(ret1, (result1, result2) -> result1 + result2);
        final Integer result = integerCompletableFuture.get();

        System.out.println(StrUtil.format("异步执行的结果: {}", result));

        System.out.println("执行时间: " + started.elapsed(TimeUnit.SECONDS));
    }
}
```

### `allOf` 和 `anyOf`

可以组合多个 `CompletableFuture` ，当每个 `CompletableFuture` 都执行完，执行后续逻辑。

```java
public static CompletableFuture<Void> allOf(CompletableFuture<?>... cfs) {
   return andTree(cfs, 0, cfs.length - 1);
}
```

可以组合多个 `CompletableFuture` ，当任何一个 `CompletableFuture` 都执行完，执行后续逻辑。

```java
public static CompletableFuture<Object> anyOf(CompletableFuture<?>... cfs) {
    return orTree(cfs, 0, cfs.length - 1);
}
```

future,future2,future3 执行完之后，再执行后续逻辑。

```java
public class CompletableFutureBlog5 {
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        final Stopwatch started = Stopwatch.createStarted();

        final CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
            try {
                TimeUnit.SECONDS.sleep(2);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println(1);
        });

        final CompletableFuture<Void> future2 = CompletableFuture.runAsync(() -> {
            try {
                TimeUnit.SECONDS.sleep(3);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println(1);
        });

        final CompletableFuture<Void> future3 = CompletableFuture.runAsync(() -> {
            try {
                TimeUnit.SECONDS.sleep(4);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println(1);
        });

        final CompletableFuture<Void> future1 = CompletableFuture.allOf(future3, future2, future);
        future1.get();
        System.out.println("执行时间: " + started.elapsed(TimeUnit.SECONDS));
    }
}
```

将上述 demo 中 allOf 替换为 anyOf，当任一 CompletableFuture 执行完毕，`future1.get();` 就会返回结果。

别的方法看参数和注释就学会了。就不再一一列举了。

当使用的时候，先考虑要不要依赖异步计算的结果，要不要处理异常，要不要返回新的异步计算结果，从这几个方面就可以知道选择哪个 api 了。
