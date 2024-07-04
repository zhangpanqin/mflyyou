# improt 配置 spring

### Import

import 既可以导入配置类，又可以 import 普通的 bean。

```java
@Import({ConfigA.class, B.class})
public class MainConfig {
}


public class ConfigA {

    @Bean
    public A a() {
        return new A();
    }
}

public class B {
}

public class A {
}


public class ImportStudy {
    public static void main(String[] args) {
        var context = new AnnotationConfigServletWebApplicationContext();
        context.register(MainConfig.class);
        context.refresh();
        var bean = context.getBean(A.class);
        System.out.println(bean);

        var beanb = context.getBean(B.class);
        System.out.println(beanb);
    }
}
```



A 和 B 都是可以被扫描的。Import 可以导入配置类。

### **ImportSelector** 

个性化导入配置类，比如说注解添加属性的时候导入某个配置类。

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Documented
@Import(FeignClientsRegistrar.class)
public @interface EnableFeignClients {}
```



ImportSelector 接口由类型来实现，这些类型根据给定的选择标准（通常是一个或多个注释属性）来确定应导入哪个 @Configuration 类。ImportSelector 可以实现以下任何 Aware 接口，并且将在 selectImports(org.springframework.core.type.AnnotationMetadata) 之前调用它们各自的方法：

- EnvironmentAware
- BeanFactoryAware
- BeanClassLoaderAware
- ResourceLoaderAware