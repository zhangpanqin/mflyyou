---
title: ThreadPoolExecutor
---

## 前言

jdk 1.8 的源码看的差不多了，计划记录一下有点难度的源码理解。

[我的 jdk 1.8 源码注释 github 地址](https://github.com/zhangpanqin/fly-jdk8)

```txt
https://github.com/zhangpanqin/fly-jdk8
```

看源码仁者见仁智者见智，看源码确实可以学到很多东西，不管是理论还是实践。不看源码也不一定什么都不懂。

技能水平不够，你看源码收获也不会多，有些思想你理解不了。

## 线程和线程池

在 Linux 下通过系统调用 fork 可以产生一个子进程，通过给 fork 传递不同的参数可以让子进程共享父进程的内存。

在 Linux 系统下，java 的线程 `Thread` 实际就是调用的系统调用 fork 产生的轻量级子进程，通过共享父进程的内存区域，从而达到多线程的目的。

系统调用需要 cpu 从用户态切换到内核态，相对于 cpu 执行时间来说，这个切换相对来说时间较长，比较占用系统资源。所以有了`线程池`，线程池中实际就是线程创建之后不销毁，run 方法中死循环从阻塞队列拿 `Runable` 去执行。

```java
// 线程池简化版原理，只为了理解线程池
public class ThreadPoolExecutor2 {
    private static final BlockingQueue<Runnable> QUEUE = new LinkedBlockingQueue();

    public boolean execute(Runnable task) {
        return QUEUE.offer(task);
    }
    static {
        new Thread(() -> {
            try {
                Runnable take;
                while (true) {
                    take = QUEUE.take();
                    if (Objects.nonNull(take)) {
                        take.run();
                    }
                }
            } catch (Throwable e) {
            }
        }).start();
    }
}
```

### 线程池使用

`jdk` 提供的线程池实现 `ThreadPoolExecutor` ，我们日常开发使用最多的也是这个。

```java
public ThreadPoolExecutor(int corePoolSize,int maximumPoolSize,
                          long keepAliveTime,TimeUnit unit,
                          BlockingQueue<Runnable> workQueue,
                          ThreadFactory threadFactory,
                          RejectedExecutionHandler handler) {
}
```

-   `corePoolSize` 线程池中核心线程数

核心线程是指，当线程空闲一段时间不会被回收的线程数量。也可以配置参数，让核心线程空闲也别回收 `ThreadPoolExecutor.allowCoreThreadTimeOut`

-   `maximumPoolSize` 线程池中最大线程数量

超过核心线程数量之后，当线程空闲一段时间会被回收

-   `long keepAliveTime,TimeUnit unit` 线程空闲多长时间会被回收
-   `workQueue` 阻塞队列，接受到的任务会储存在这里面，为了避免 oom ,一定要设置队列的大小
-   `threadFactory` 创建线程的工厂

```java
// 我们可以在线程工厂中定义线程名称的前缀，方便判断是哪个业务的线程池有问题
// 线程池中的线程默认为工作线程，可以设置线程工厂创建的线程为守护线程
private static ThreadFactory getThreadFactory() {
    final ThreadFactoryBuilder threadFactoryBuilder = new ThreadFactoryBuilder();
    threadFactoryBuilder.setNameFormat("order-thread-poll-%s");
    // 设置线程池中的线程是否为守护线程
    threadFactoryBuilder.setDaemon(true);
    // 当线程执行发生了异常，jvm 会调用 Thread.dispatchUncaughtException,然后调用设置的 UncaughtExceptionHandler
    threadFactoryBuilder.setUncaughtExceptionHandler((thread, throwable) -> {
        System.out.println(StrUtil.format("线程执行发生了异常,名称为: {}", thread.getName()));
        System.out.println(StrUtil.format("线程执行发生了异常,异常信息为: {}", throwable.getMessage()));
    });
    return threadFactoryBuilder.build();
}
```

-   handler 任务不能被线程池接受处理时的拒绝策略

队列中的任务需要内存，由于内存有限，我们不能无限制接受任务，当任务不能被线程池接受时，需要根据策略来执行应该怎么拒绝这个任务或者执行这个任务。

```txt
AbortPolicy: 调用 execute 时抛出异常
CallerRunsPolicy: 在调用者线程中执行这个任务。就是同步调用 execute 时，实际执行这个 Runable 的 run 方法。
DiscardOldestPolicy: 抛弃队列中最久的任务，然后再次调用这个线程池的 execute(Runable)
DiscardPolicy: 不处理，丢弃掉这个任务。调用者感知不到
```

![531605003712_.pic_hd](/blog/20201114210852.jpg?author=zhangpanqin)

## 线程池源码

线程有线程的状态。线程池也有线程池的状态。

```java
public class ThreadPoolExecutor extends AbstractExecutorService {
    /**
     * 表示线程池的状态和线程池中线程数量
     * int 占四个字节，32 bit
     * 高三位表示线程池的状态，后 29 表示线程的数量
     */
    private final AtomicInteger ctl = new AtomicInteger(ctlOf(RUNNING, 0));
    // COUNT_BITS 为 29
    private static final int COUNT_BITS = Integer.SIZE - 3;
    /**
     * 可以接受新的任务，也可以处理阻塞队列里的任务
     * 前三位为 111
     */
    private static final int RUNNING = -1 << COUNT_BITS;

    /**
     * 不接受新的任务，但是可以处理阻塞队列里的任务
     * 前三位为 000
     */
    private static final int SHUTDOWN = 0 << COUNT_BITS;

    /**
     * 不接受新的任务，不处理阻塞队列列的任务，中断正在处理的任务
     * 前三位为 001
     */
    private static final int STOP = 1 << COUNT_BITS;

    /**
     * 过渡状态，也就是说所有的任务都执行完了，当前线程池已经没有有效的线程，
     * 这个时候线程池的状态将会TIDYING，并且将要调用 terminated 方法
     * 前三位为 010
     */

    private static final int TIDYING = 2 << COUNT_BITS;

    /**
     * 线程池调用了 terminated 方法,资源已经释放完
     * 前三位为 011
     */
    private static final int TERMINATED = 3 << COUNT_BITS;

   /**
     * 获取线程池的状态
     */
    private static int runStateOf(int c) {
        return c & ~CAPACITY;
    }

    /**
     * 获取工作线程的数量
     */
    private static int workerCountOf(int c) {
        return c & CAPACITY;
    }
}
```

![image-20201114230504012](/blog/20201114230504.png?author=zhangpanqin)

打断线程其实就是调用了线程的 `Thread.interrupt()`，只是标记了线程被打断，不会影响程序运行，打断的线程调用 `Thread.isInterrupted()` 返回 true。当线程阻塞等待时被打断，会抛出异常 `InterruptedException` ，在线程 run 方法中如果捕获处理这个异常，线程就会退出。

```java
// 线程是停不下来的，因此线程也停不下来。
public static void main1(String[] args) {
    THREAD_POOL_EXECUTOR.execute(() -> {
        while (true) {
        }
    });
    THREAD_POOL_EXECUTOR.shutdownNow();
}
// 当捕获到打断异常抛出，然后线程没有处理异常，导致线程退出，线程池也退出了
public static void main2(String[] args) {
    THREAD_POOL_EXECUTOR.execute(() -> {
        while (true) {
            try {
                Thread.sleep(1);
            } catch (InterruptedException e) {
                e.printStackTrace();
                throw new RuntimeException(e);
            }
        }
    });
    THREAD_POOL_EXECUTOR.shutdownNow();
}
```

### execute

```java
public void execute(Runnable command) {
    if (command == null) {
        throw new NullPointerException();
    }
    int c = ctl.get();
    /**
      * 线程池中线程数量少于核心线程数量，创建新的线程执行任务，创建新的线程执行任务成功，return。
      */
    if (workerCountOf(c) < corePoolSize) {
        if (addWorker(command, true)) {
            return;
        }
        c = ctl.get();
    }
    /**
      * 线程池中,线程数量大于核心线程数，将任务添加至队列中去，等待被执行。
      * 如果任务添加队列失败，如果没有达到最大线程数量，开启新的线程执行任务；达到最大线程数量，执行拒绝策略。
      */
    if (isRunning(c) && workQueue.offer(command)) {
        int recheck = ctl.get();
        // 再次检查线程池状态,如果线程关闭,从队列中移除这个任务
        if (!isRunning(recheck) && remove(command)) {
            reject(command);
            // 如果线程池在运行状态,但是没有工作进程。添加一个工作线程，这个线程会从队列那任务执行
        } else if (workerCountOf(recheck) == 0) {
            addWorker(null, false);
        }
    } else if (!addWorker(command, false)) {
        reject(command);
    }
}
```

### addWorker

```java
// 创建新的线程,并调用这个线程的 start 方法,返回 true
private boolean addWorker(Runnable firstTask, boolean core) {
        retry:
        /**
         * 双层 for 循环为了判断线程池的状态是否正在运行和线程数量是否满足定义
         */
        for (; ; ) {
            int c = ctl.get();
            /**
             * rs 为线程池运行状态
             */
            int rs = runStateOf(c);

            /**
             * 1.当线程池 shutdown 之后,任务是不能添加的.当存在任务时,返回 false
             * 2.当线程池 shutdown 之后,当任务队列为空时也返回 false
             */
            if (rs >= SHUTDOWN && !(rs == SHUTDOWN && firstTask == null && !workQueue.isEmpty())) {
                return false;
            }

            for (; ; ) {
                // 判断线程池中线程数量是否满足定义
                int wc = workerCountOf(c);
                if (wc >= CAPACITY || wc >= (core ? corePoolSize : maximumPoolSize)) {
                    return false;
                }
                // cas 怎么工作线程数量
                if (compareAndIncrementWorkerCount(c)) {
                    break retry;
                }
                c = ctl.get();  // Re-read ctl
                if (runStateOf(c) != rs) {
                    continue retry;
                }
                // else CAS failed due to workerCount change; retry inner loop
            }
        }
        // worker 中的 线程是否调用了 start 方法
        boolean workerStarted = false;
        // 是否将这个 worker 添加到 workers 这个 HashSet 中去
        boolean workerAdded = false;
        Worker w = null;
        try {
            // 创建新的线程
            w = new Worker(firstTask);
            final Thread t = w.thread;
            if (t != null) {
                final ReentrantLock mainLock = this.mainLock;
                mainLock.lock();
                try {
                    int rs = runStateOf(ctl.get());
                    if (rs < SHUTDOWN || (rs == SHUTDOWN && firstTask == null)) {
                        if (t.isAlive()) {
                            throw new IllegalThreadStateException();
                        }
                        workers.add(w);
                        int s = workers.size();
                        if (s > largestPoolSize) {
                            largestPoolSize = s;
                        }
                        workerAdded = true;
                    }
                } finally {
                    mainLock.unlock();
                }
                // 将 worker 添加到 workers 中去,说明这个 worker 第一次使用.要启动这个线程 start
                if (workerAdded) {
                    t.start();
                    workerStarted = true;
                }
            }
        } finally {
            if (!workerStarted) {
                addWorkerFailed(w);
            }
        }
        return workerStarted;
    }
```

### Worker.run

```java
// 实际调用 runWorker
public void run() {
    runWorker(this);
}
```

```java
final void runWorker(Worker w) {
    Thread wt = Thread.currentThread();
    Runnable task = w.firstTask;
    w.firstTask = null;
    w.unlock(); // allow interrupts
    // 线程执行是否由于异常导致的,true 代表异常退出了
    boolean completedAbruptly = true;
    try {
        // 线程中不停的获取队列头部的任务去执行
        // getTask 实际是调用阻塞队列的workQueue.poll(keepAliveTime, TimeUnit.NANOSECONDS)
        // 当线程池中线程数量大于核心线程数，getTask 由于超时返回了 null 线程执行退出。释放掉了线程
        while (task != null || (task = getTask()) != null) {
            w.lock();
            // If pool is stopping, ensure thread is interrupted;
            // if not, ensure thread is not interrupted.  This
            // requires a recheck in second case to deal with
            // shutdownNow race while clearing interrupt
            if ((runStateAtLeast(ctl.get(), STOP) || (Thread.interrupted() && runStateAtLeast(ctl.get(), STOP))) && !wt.isInterrupted()) {
                wt.interrupt();
            }
            try {
                // 任务执行之前的钩子函数
                beforeExecute(wt, task);
                Throwable thrown = null;
                try {
                    task.run();
                } catch (RuntimeException x) {
                    thrown = x;
                    throw x;
                } catch (Error x) {
                    thrown = x;
                    throw x;
                } catch (Throwable x) {
                    thrown = x;
                    throw new Error(x);
                } finally {
                    // 任务执行之后的钩子函数
                    afterExecute(task, thrown);
                }
            } finally {
                task = null;
                w.completedTasks++;
                w.unlock();
            }
        }
        completedAbruptly = false;
    } finally {
        processWorkerExit(w, completedAbruptly);
    }
}
```

### tryTerminate

`tryTerminate` 尝试关闭线程池。

```java
 	/**
     * 当涉及移除 work 时,都要尝试判断线程池是否能退出了
     */
    final void tryTerminate() {
        for (; ; ) {
            int c = ctl.get();
            if (isRunning(c) || runStateAtLeast(c, TIDYING) || (runStateOf(c) == SHUTDOWN && !workQueue.isEmpty())) {
                return;
            }
            /**
             * 如果工作线程不为 0 ,打断一个线程
             */
            if (workerCountOf(c) != 0) {
                interruptIdleWorkers(ONLY_ONE);
                return;
            }

            /**
             * 走到这里，工作线程为 0 了,并且队列中任务也为 0 ,设置线程池状态为 TIDYING
             * 设置线程池状态为 TIDYING 并调用 terminated() ，调用 terminated() 方法之后设置线程池状态为 TERMINATED
             */
            final ReentrantLock mainLock = this.mainLock;
            mainLock.lock();
            try {
                if (ctl.compareAndSet(c, ctlOf(TIDYING, 0))) {
                    try {
                        terminated();
                    } finally {
                        ctl.set(ctlOf(TERMINATED, 0));
                        termination.signalAll();
                    }
                    return;
                }
            } finally {
                mainLock.unlock();
            }

        }
    }
```
