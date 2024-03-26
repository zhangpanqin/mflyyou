# Java 类加载器及类加载过程

::: warning
JDK 环境：  1.8
:::



## 类加载器介绍

```java
public class Main {
    public static void main(String[] args) {
        // sun.misc.Launcher$AppClassLoader
        System.out.println(Main.class.getClassLoader());
        // sun.misc.Launcher$ExtClassLoader
        System.out.println(Main.class.getClassLoader().getParent());
        // null 实际是 BootstrapClassLoader
        System.out.println(Main.class.getClassLoader().getParent().getParent());
        // null 实际是 BootstrapClassLoader
        System.out.println(ArrayList.class.getClassLoader());
    }
}
```



```java
public static void main(String[] args) {
  // JAVA_HOME
  System.out.println(System.getProperty("java.home"));
  // BootstrapClassLoader 加载的路径: JAVA_HOME/lib/*.jar 和 JAVA_HOME/classes
  System.out.println(System.getProperty("sun.boot.class.path"));
  // ExtClassLoader 加载的路径: JAVA_HOME/lib/ext/*.jar
  System.out.println(System.getProperty("java.ext.dirs"));
  // AppClassLoader 加载的路径: classpath
  System.out.println(System.getProperty("java.class.path"));
}
```

![classloader](./class-loader.assets/classloader.png)

### 双亲委派机制

双亲委派模型并不是一种强制性的约束。而是官方推荐的一种方式。

当我需要遵循双亲委派机制，我们实现 `findClass(String name)` 。

当我们<font color=red>不需要</font> 双亲委派机制，我们实现 `loadClass(String name) `。



#### 打破双亲委派的示例

**Spi** 是 **Service Provider Interface** 的简称，SPI 是系统为第三方专门开放的扩展规范以及动态加载扩展点的机制。

**DriverManager **在 rt.jar 下，是由 BootstrapClassLoader 加载的，类初始化的时候，它需要加载厂商的实现，使用了  `Thread.currentThread().getContextClassLoader` 如果启动线程的时候没有设置值，它就是 `AppClassLoader`，AppClassLoader 加载了我们实现的数据库驱动。



## 类加载过程

![Java类加载过程](./class-loader.assets/load-process.png)

### 加载

**加载阶段** 主要定义从哪里加载我们的 class 文件二进制流，生成 class 对象存入堆中。

#### 类的加载时机

- 当我 new 一个对象时
- 读取或者设置静态字段
- 调用静态方法
- 使用反射调用，触发类加载
- 初始化类的时候，如果父类没有初始化，会触发父类加载

```java
public class Father {
    public static int a;
    static {
        System.out.println("Father 静态方法");
    }
    public static void test1() {
        System.out.println("Father test");
    }
}
public class Son extends Father{
    public static int b;
  	public static final int c = 111;
    static {
        System.out.println("Son 静态方法");
    }
    public static void test2() {
        System.out.println("Son test");
    }
}
```

`-XX:+TraceClassLoading ` 可以追踪 class 的加载。

::: tip

`Son.a` 会触发 `Son` 和 `Father` 的类的加载，只会触发 Father 的初始化，而不会触发 `Son` 的初始化。

`Son.b` 会触发 `Son` 和 `Father` 的类的加载和初始化。

`Son.test1` 和 `Son.test2` 一样的原理。

`Son.c` 不会触发会触发 `Son` 和 `Father` 的类的加载。这是因为编译之后，这儿 Son.c 就被替换了成了真正的常量（bipush 111）。

:::









如果我们自定义了类加载器，我们可以定义从任意地方加载我们的 `class` 文件。

- 定义从网络下载 class 文件字节流。
- 定义class 字节流的加密解密，比如说：私钥加密，公钥解密 class 字节流。

```java
ClassLoader loader = new NetworkClassLoader(host, port);
Object main = loader.loadClass("Main", true).newInstance();


class NetworkClassLoader extends ClassLoader {
          String host;
          int port;
 
          public Class findClass(String name) {
              byte[] b = loadClassData(name);
              return defineClass(name, b, 0, b.length);
          }
 
          private byte[] loadClassData(String name) {
              // load the class data from the connection
          }
}
```

### 连接

**连接阶段** 主要是保证 class 符合规范，安全检查及初始化。

**验证阶段**：主要是为了 验证 class 文件规范及语法正确，

**准备阶段** ：初始化 `类变量`，先将 value 初始化为 0

```java
public static int value=111
```

**解析阶段**：主要是进行引用替换，设置类，字段，方法等在内存的地址。



### 初始化

执行我们类的初始化 `cinit`。

1. 给静态变量赋值

2. 执行静态代码块

静态代码块和静态变量赋值都只在类加载的时候有且只执行一次。

我们构造器的代码是在，new 对象的执行。每次 new 都会执行。



因此 `new Son()` 会执行以下步骤：

- 触发 Son 的类加载，父类 Father 没有加载，先加载 Father
- 类加载 Father，触发 Father 类初始化
- 再类加载 Son，触发 Son 类初始化
- 执行 Father 构造函数，再执行子类 Son 构造函数

