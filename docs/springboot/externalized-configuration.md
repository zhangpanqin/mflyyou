---
title: SpringBoot 属性配置
---

# SpringBoot 属性配置

### 配置文件加载顺序

1. Command line arguments. （--name="Spring"）
2. Java System properties (`System.getProperties()`). （Java -D 指定的和一些默认的 java 配置有关的属性）
3. OS environment variables.
4. Config data (such as `application.properties` files).
5. [`@PropertySource`](https://docs.spring.io/spring-framework/docs/6.0.9/javadoc-api/org/springframework/context/annotation/PropertySource.html) annotations on your `@Configuration` classes. Please note that such property sources are not added to the `Environment` until the application context is being refreshed.
6. Default properties (specified by setting `SpringApplication.setDefaultProperties`).

**Config data**

1. From the classpath
    1. The classpath root
    2. The classpath `/config` package
2. From the current directory
    1. The current directory
    2. The `config/` subdirectory in the current directory
    3. Immediate child directories of the `config/` subdirectory

**spring.config.import**

`spring.config.import` 和声明的位置有关，它会比声明的位置的配置优先级高。

```properties
# 指定文件以 yaml 解析
spring.config.import=file:/etc/config/myconfig[.yaml]
```

```properties
# application.properties
spring.application.name=myapp
spring.config.import=optional:file:./dev.properties
```

dev.properties 比 application.properties 优先级高。

**Directly Loading YAML**

Spring Framework provides two convenient classes that can be used to load YAML documents. The `YamlPropertiesFactoryBean` loads YAML as `Properties` and the `YamlMapFactoryBean` loads YAML as a `Map`.

You can also use the `YamlPropertySourceLoader` class if you want to load YAML as a Spring `PropertySource`.

**Binding From Environment Variables**

SpringBoot 为了将系统环境变量的值对应到配置文件，它会做一个转换。

-   Replace dots (`.`) with underscores (`_`).
-   Remove any dashes (`-`).
-   Convert to uppercase.

比如配置 `spring.profiles.active` 对应的环境变量就是 `SPRING_PROFILES.ACTIVE`

:::tip

推荐使用全小写字母，- 隔开单词进行，配置属性定义。

:::

### 配置属性使用

自动化配置 starter 中定义

```java
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(SomeProperties.class)
public class MyConfiguration {

}
@ConfigurationProperties("some.properties")
public class SomeProperties {

}
```

从 springboot `Environment` 中注册 bean。

```java
@Configuration(proxyBeanMethods = false)
public class ThirdPartyConfiguration {

    @Bean
    @ConfigurationProperties(prefix = "another")
    public AnotherComponent anotherComponent() {
        return new AnotherComponent();
    }

}
```

### 热更新配置

只有引入`org.springframework.cloud:spring-cloud-starter-bootstrap`。在 `bootstrap.yaml` 配置的属性，才可以通过 `/actuator/refresh` 刷新。

```yaml
spring:
    config:
        import: classpath:secrets-mock.yaml
management:
    endpoints:
        web:
            exposure:
                include: "*"
```

```sh
curl -X POST localhost:8080/actuator/refresh
```

### Spring Cloud Kubernetes Configuration

Load application properties from Kubernetes [ConfigMaps](https://docs.spring.io/spring-cloud-kubernetes/docs/current/reference/html/#configmap-propertysource) and [Secrets](https://docs.spring.io/spring-cloud-kubernetes/docs/current/reference/html/#secrets-propertysource).

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
    name: { { include "application.fullname" . } }
    namespace: { { .Values.namespace } }
    labels:
        spring.cloud.kubernetes.config: "true"
data:
    application.yaml: |-
        spring:
          application:
            name: {{ include "application.fullname" . }}
          cloud:
              kubernetes:
                namespace: {{ .Values.namespace }} # 默认和 pod 同一个 namespace，可以不设置
                config:
                  sources:
                    - name: {{ include "application.fullname" . }}
                    - name: sample2
        {{- tpl (toYaml .Values.config) . | nindent 4 }}
```

```shell
# 会刷新对应 pod 的 environment
curl -X POST localhost:8080/actuator/refresh
```
