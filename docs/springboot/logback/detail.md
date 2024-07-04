## SpringBoot 集成 Logback

SpringBoot 默认使用的是 Logback 日志实现，根据 classpath 找对应的实现。

配置文件使用 **logback-spring.xml**，这样可以使用 SpringBoot 扩展 Logback 的功能。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
	<include resource="org/springframework/boot/logging/logback/defaults.xml" />
	<include resource="org/springframework/boot/logging/logback/console-appender.xml" />	<include resource="org/springframework/boot/logging/logback/file-appender.xml" />
	<root level="INFO">
		<appender-ref ref="FILE" />
	</root>
</configuration>
```

SpringBoot 默认配置：**文件日志**写入，**控制台日志**写入

- `${PID}`: The current process ID，这个是 Logback 初始化的时候设置的 properties。



SpringBoot 扩展的功能，不同的环境激活相对应的配置

```xml
<springProfile name="staging">
	<!-- configuration to be enabled when the "staging" profile is active -->
</springProfile>

<springProfile name="dev | staging">
	<!-- configuration to be enabled when the "dev" or "staging" profiles are active -->
</springProfile>

<springProfile name="!production">
	<!-- configuration to be enabled when the "production" profile is not active -->
</springProfile>

<springProperty scope="context" name="fluentHost" source="myapp.fluentd.host"
		defaultValue="localhost"/>
<property scope="context" name="fluentHost" value="11"/>
<appender name="FLUENT" class="ch.qos.logback.more.appenders.DataFluentAppender">
	<remoteHost>${fluentHost}</remoteHost>
</appender>
```



`<springProperty>` 可以配置读取 Environment 的配置。source 制定从Environment 那个配置属性来。

#### 以下是 Logback 的默认功能

配置属性还可以从另一个文件引入，详情参考官网。

`<property>` logback 的标准实现，定义配置在 xml。

scope 指定配置属性的作用范围：

- `context` 只在当前文件都可以使用
- `local`  在当前上下文内可用
- `system` 绑定到 System Property

配置属性缺省默认值，和 Bash shell 一样的语法，`:-` 制定默认值，aName 不存在，值为 golden

```bash
${aName:-golden}
```



### 怎么配置日志格式

[PatternLayout](https://logback.qos.ch/manual/layouts.html#ClassicPatternLayout)

### 自定义 Appender

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <!-- https://logback.qos.ch/manual/layouts.html#ClassicPatternLayout -->
    <property scope="context"
              name="CUSTOMER_CONSOLE_LOG_PATTERN"
              value="%d{yyyy-MM-dd HH:mm:ss.SSS} [%-16.16thread{15}] [%X{traceId}] [%X{loginName}] [%-5level] [%-40.40logger{39}] [line:%-6L]: %m%n"/>

    <property scope="context"
              name="CONSOLE_LOG_CHARSET"
              value="UTF-8"/>

    <appender name="CONSOLE" class="com.mflyyou.MyConsoleAppender">
        <encoder>
            <pattern>${CUSTOMER_CONSOLE_LOG_PATTERN}</pattern>
            <charset>${CONSOLE_LOG_CHARSET}</charset>
        </encoder>
        <myName>小张</myName>
    </appender>
    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
    </root>
</configuration>
```

```java
public class MyConsoleAppender<E> extends ConsoleAppender<E> {
    private String myName;

    public void setmyName(String name) {
        this.myName = name;
    }

    @Override
    protected void append(E eventObject) {
        super.append(eventObject);
        System.out.println(myName + ": " + eventObject);
    }
}
```



## Logback Architecture

### Logback 的核心概念

#### Logger

Logger 是 Logback 的核心组件，用于记录日志消息。

Logger 通常与类或包名关联，以便分级管理和控制日志输出。

Logger 有多个级别（level），如 TRACE、DEBUG、INFO、WARN、ERROR，通过这些级别可以控制哪些日志消息被记录和输出。

#### Appender

Appender 是日志输出的目标，可以是控制台、文件、数据库、远程服务器等。

Logger 可以附加多个 Appender，这样同一条日志消息可以同时输出到多个目标。

常见的 Appender 包括 `ConsoleAppender` 和 `FileAppender`。

#### Encoder

Encoder 负责将日志事件格式化为字节数组。Logback 提供了多种 Encoder，最常用的是 `PatternLayoutEncoder`，它允许用户通过指定的 pattern 来定义日志输出格式。

**持有 Layout 对象。**

#### Layout

Layout  负责将日志事件格式化为字符串。最常用的 `PatternLayout` 可以通过配置 pattern 来定制输出格式，例如日期、线程名、日志级别、消息内容等。

**持有 convert 对象，进行参数翻译。**

#### Filter

Filter 可以用于进一步控制日志输出。通过添加 Filter，可以有条件地输出日志消息。例如，可以通过过滤日志级别或消息内容来决定是否输出某条日志。