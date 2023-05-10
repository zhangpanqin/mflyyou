## JVM 参数查看

```shell
# 可以查看 jvm 默认配置，例如 size_t MaxHeapSize = 130862280 {product} {default}
java -Xmx200m -XX:+PrintFlagsInitial -version

# 命令行参数，影响了 jvm 配置 size_t MaxHeapSize = 209715200  {product} {command line}
java -Xmx200m -XX:+PrintFlagsFinal -version

# 如果是已经启动的 java 进程,使用下面
jinfo pid
```

https://medium.com/platform-engineer/understanding-java-memory-model-1d0863f6d973

[Understanding Java Garbage Collection | by Thilina Ashen Gamage | Platform Engineer | Medium](https://medium.com/platform-engineer/understanding-java-garbage-collection-54fc9230659a)

[Understanding JVM Architecture. Understanding JVM architecture and how… | by Thilina Ashen Gamage | Platform Engineer | Medium](https://medium.com/platform-engineer/understanding-jvm-architecture-22c0ddf09722)

