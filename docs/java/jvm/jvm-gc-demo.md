# GC 示例

### 堆 OOM

在 idea 启动程序的时候，传入虚拟机参数 -Xms100m -Xmx100m -XX:+HeapDumpOnOutOfMemoryError。并使用 jvisualvm 观察堆的使用情况。

运行结果会抛出 java.lang.OutOfMemoryError: Java heap space。

`HeapDumpOnOutOfMemoryError` 指定了抛出异常时 dump 内存到文件中。我们可以通过分析这个文件，看那些对象占用比较多，从而分析问题。

```java
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
