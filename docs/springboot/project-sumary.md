---
title: 项目总结
---

### 前言

在 `ThoughWorks` 的第一个项目已经结束，在项目上也学到了不少技术，Gradle，DDD，k8s，graphql，契约测试，集成测试等等。还有下个项目从头开始的 `devops`。

最近自己也在总结项目上的一些不错的实践，将来的项目说不定也需要用到。

### 配置属性的管理

有的时候我们需要屏蔽不必要的技术细节和复杂度传递，比如 `sleuth` ，`zipkin`，`actuator` ，`数据库连接池` 等配置，开发的注意力应该较多集中在业务上。

同时又需要提供可以覆写的自由度，比如公共库中配置了 `server.max-http-header-size: 10KB` ，但有的项目也可以修改为 `50KB`。

`Spring` 的配置属性由 `Environment` 统一管理，同时针对不同配置的来源抽象了`PropertySource` ，当需要查找某个属性时，根据配置的优先级从 `PropertySource` 查找，找到就返回。

我们常用到的配置加载顺序

1. Command line arguments
2. Java System properties
3. ./file:/config/application-{profile}.yml
4. ./file:/application-{profile}.yml
5. ./file:/config/application.yml6
6. ./file:/application.yml5
7. classpath:/config/application-{profile}.yml
8. classpath:/application-{profile}.yml
9. classpath:/config/application.yml
10. classpath:/application.yml

我们可以实现 `EnvironmentPostProcessor` 添加一些 PropertySource 到 Environmen 中去。

11. classpath:/application-default-{profile}.yml
12. classpath:/application-default.yml

[代码预览 ApplicationDefaultEnvironmentPostProcessor](https://github.com/zhangpanqin/fly-spring-cloud/blob/master/cloud-common/src/main/java/com/mflyyou/cloud/common/env/ApplicationDefaultEnvironmentPostProcessor.java)

然后在 `META-INF/spring.factories` 配置让 SpringBoot 的 SPI 去加载我们的实现

```txt
org.springframework.boot.env.EnvironmentPostProcessor=\
    com.mflyyou.cloud.common.env.ApplicationDefaultEnvironmentPostProcessor
```

### 参数解析

在同一个项目中 `LocalDateTime` 如果既可以传 `yyyy/MM/dd HH:mm:ss` 又可以传 `yyyy-MM-dd HH:mm:ss`，那得多崩溃，也不好维护。

返回的 json 中日期格式如果也不固定，前端估计意见也挺大的。

我们可以实现 `Converter` 统一 `form/data` 和 `QueryString` 参数解析。

```java
// 然后将 WebMvcConfiguration 注册为 Spring 的 Bean
public class WebMvcConfiguration implements WebMvcConfigurer {
    @Override
    public void addFormatters(FormatterRegistry registry) {
        // form 表单个 query String 用下面的 convert 转换参数
        registry.addConverter(new String2InstantConverter());
        registry.addConverter(new String2LocalDateConverter());
        registry.addConverter(new String2LocalDateTimeConverter());
        registry.addConverter(new LocalDate2StringConverter());
    }
}
```

SpringBoot 使用 Jackson 将 request body 反序列化为 Java 对象，也使用 Jackson 将 java 对象序列化之后返回前端。

查看源码 `JacksonAutoConfiguration` 我们可以看到，通过实现 `Jackson2ObjectMapperBuilderCustomizer` 扩展 ObjectMapper

[Convert 代码预览](https://github.com/zhangpanqin/fly-spring-cloud/tree/master/cloud-common/src/main/java/com/mflyyou/cloud/common/convert)

[jackson 扩展代码预览](https://github.com/zhangpanqin/fly-spring-cloud/blob/master/cloud-common/src/main/java/com/mflyyou/cloud/common/CommonJacksonCustomizerAutoConfiguration.java)

### 统一异常处理

项目中有一些异常是都会碰到的，比如权限异常，登录异常，token 异常等，但也有一些业务异常在各个微服务中不一样，就需要差异性处理。

因此我们需要公共异常在公共库中统一处理，差异的异常服务自治。

异常返回参数格式有必要统一，这样前端可以根据 code 友好展示提示信息，展示的信息建议前端维护。

```json
{
    "message": {
        "message": "Lock name is [1] and type is [SIMPLE_LOCK], failure to unlock"
    },
    "codeDescription": "Server is busy and try again later",
    "code": "SERVER_IS_BUSY_AND_TRY_AGAIN_LATER"
}
```

`DispatcherServlet` 代码可以看到 SpringMvc 使用 `HandlerExceptionResolver` 处理异常。

`WebMvcAutoConfiguration` 可以看到注册了 `EnableWebMvcConfiguration` ,而 `DelegatingWebMvcConfiguration` 继承了 WebMvcConfigurationSupport，这样就把默认的 HandlerExceptionResolver 生效了。

```java
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(WebProperties.class)
public static class EnableWebMvcConfiguration extends DelegatingWebMvcConfiguration implements ResourceLoaderAware {

}

public class WebMvcConfigurationSupport implements ApplicationContextAware, ServletContextAware {
  @Bean
	public HandlerExceptionResolver handlerExceptionResolver(
			@Qualifier("mvcContentNegotiationManager") ContentNegotiationManager contentNegotiationManager) {
		List<HandlerExceptionResolver> exceptionResolvers = new ArrayList<>();
		configureHandlerExceptionResolvers(exceptionResolvers);
		if (exceptionResolvers.isEmpty()) {
      // 加载 ExceptionHandlerExceptionResolver 等，用于 @ExceptionHandler
			addDefaultHandlerExceptionResolvers(exceptionResolvers, contentNegotiationManager);
		}
    // 加载了 WebMvcConfigurer.extendHandlerExceptionResolvers 配置的自定义 HandlerExceptionResolver
		extendHandlerExceptionResolvers(exceptionResolvers);
		HandlerExceptionResolverComposite composite = new HandlerExceptionResolverComposite();
		composite.setOrder(0);
		composite.setExceptionResolvers(exceptionResolvers);
		return composite;
	}
}
```

`ErrorMvcAutoConfiguration` 代码可以看到 SpringBoot 为我们注册了 `DefaultErrorAttributes`，它也是一个 HandlerExceptionResolver ，主要用于标记当前请求是否发生了异常， EnableWebMvcConfiguration 注册的 HandlerExceptionResolver 如果处理了异常，`DispatcherServlet` 会清楚异常标记，然后请求就返回了错误提示信息。

有异常标记的请求，在 Tomcat 中会转发到 /error 去处理，`ErrorMvcAutoConfiguration` 注册的 `BasicErrorController` 用于处理 /error 请求。

![exception](/blog/20210815195645.png?author=zhangpanqin)

### 公共库 Bean 管理

`@SpringBootApplication` 只会扫描所在类包下及子包中的 `@Configuration` ，我们在公共库直接加 `@Configuration 等` 可能不会使配置生效， 建议在

`META-INF/spring.factories` 添加如下配置将其生效。

```txt
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
    com.mflyyou.cloud.common.CommonWebMvcAutoConfiguration
```

这利用 SpringBoot 的自动加载原理，制作项目自己的 starter。

### Aop

公共库的 Aop 不要使用注解式，使用编程式。

`Advisor` 切面，标明执行哪些方法的时候，执行某些通知。一般可以继承 AbstractPointcutAdvisor。

`Pointcut` 切入点，标明需要拦截哪些方法。AnnotationMatchingPointcut 可以匹配注解标记，当类上注解有，当方法上有注解。`ComposablePointcut` 可以用于聚合多个 Pointcut。

`Advice` 通知，我们可以实现 `MethodInterceptor` 做到逻辑的植入。

[示例代码预览 DistributedLockAdvisor](https://github.com/zhangpanqin/fly-spring-cloud/blob/master/cloud-common/src/main/java/com/mflyyou/cloud/common/lock/DistributedLockAdvisor.java)。

我们可以通过配置 `Advisor` 的 order ，来影响 Advice 执行的顺序。比如我们的日志切面需要在最外层执行。

切面执行顺序一定要考虑优先级，不然可能会出现由于事务问题导致脏数据。

为了知道为什么会发生这个问题，我们需要知道 aop 切面执行的顺序。它执行 和 Filter 差不多，责任链模式。

![aop](/blog/20210815195651.png?author=zhangpanqin)

执行顺序可以按照标注的序号理解，如果 aspect 2 为事务切面，aspect 1 为分布式锁切面。

如果 aspect 2 执行完，事务提交了，而在执行第 9 步的时候，Redis 奔溃，导致分布式锁解锁失败，返回了错误提示信息，但是数据却持久化了。

<font color=red>`@EnableTransactionManagement` order 属性可以修改事务切面的顺序，先执行事务切面，在执行分布式锁切面，这样事务切面就能感知到分布式锁切面的异常从而控制事务回滚。</font>

### FAQ

#### user.dir 是哪个目录？

`./file` 实际是 `System.getProperty("user.dir")` ，在那个目录下执行 java 命令，`usr.dir` 就会被 JVM 赋值为执行命令的路径。

```java
// java -cp /fly-spring-cloud/order-management-service/build/classes/java/main com.mflyyou.cloud.UserDirDemo
public class UserDirDemo {
    public static void main(String[] args) {
        System.out.println(System.getProperty("user.dir"));
    }
}
```

当在 `/Users/panqinzhang/github/fly-spring-cloud/user-management-service` 运行代码中的命令，user.dir 就是 user-management-service 目录绝对路径。

当在 `/Users/panqinzhang/github/fly-spring-cloud/order-management-service` 运行代码中的命令，user.dir 就是 order-management-service 目录绝对路径。

#### Command line arguments 和 Java System properties 说明

```shell
# -D 定义 Java System properties
# --name=aaa 定义 Command line arguments，注意 -- 必须带，不然配置不会生效，在 java -? 有说明
java -Dfile.encoding=UTF-8 -cp /order-management-service/classes com.mflyyou.cloud.UserDirDemo --name=aaa
```
