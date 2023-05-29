# java command

## java -cp

```sh
java -cp @./java-app/classpath-file com.mflyyou.HelloWorld

java -cp @/Users/panqinzhang/dev_test/java-app/classpath-file com.mflyyou.HelloWorld
```

```
.
├── libs
├── classes
│   └── com
│       └── mflyyou
│           ├── HelloWorld.class
└── classpath-file
```

```java
// HelloWorld
package com.mflyyou;

public class HelloWorld {
    public HelloWorld() {
    }

    public static void main(String[] args) {
        System.out.println("Hello world");
    }
}
```

```sh
# classpath-file
# 或者 ./java-app/classes:./java-app/libs
/Users/panqinzhang/dev_test/java-app/classes:/Users/panqinzhang/dev_test/java-app/libs/spring-boot-starter-actuator-2.7.12.jar
```

## java -D

set a system property
java -DAA=BB MyProgram
