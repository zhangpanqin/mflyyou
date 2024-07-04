## Aop

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

