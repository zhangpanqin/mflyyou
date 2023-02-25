数据类型

### 基础数据类型

```bash
# 查看 key 属于那种数据类型
type key
# 设置 key 多少秒过期，过期的 key 会被 rendis 自动删除 
expire key seconds

# 设置 name1 5 秒后过期
expire name1 5

# 
del

# 查看 key 还有多长时间过期
tll key 
```

#### string

```bash
# 设置某个 key 的值是 value
set key value
set name1 zhangsan

# 获取某个 key 的值
get key
get name1

# 批量设置值 
mset key1 value1 key2 value2
mset name1 zhangsan name2 lisi

# 批量获取某些 key 的值
mget key1 key2
mget key1 key2

# 设置 key 多少秒后过期，等价于 set+expire
setex key seconds value
setex name1 5 zhangsan

# 当 key 不存在的时候创建
setnx key value

# 对值是数字的 key 进行计数操作
set age 30

# age +1
incr age

# 对 age 加 5
incriby age 5
```

#### hash

```bash
# 类似 Map
hset key field value
hset person name1 zhangsan

# 获取值
hget key field
hget person name1

# 获取 key 的所有 field value
hgetall person

# 获取 key 的 field 个数 
hlen person

# 批量设置 key 的 field value
hmset key field1 value1 field2 value2
hmset person name1 zhangsan name2 lisi

# 对 field 的 value 进行加 1 操作 
hincrby key field increment
hset book3 age 3
# 对 age 的值加5
hincrby book3 age 5
# 得到 8
hget book3 age
```

#### list

```bash
# 列表

# 从列表的右边依次推进 值
rpush key value1 value2 value3

# 返回列表长度
llen key

# 左边弹出一个元素 
lpop key

# 右边弹出一个元素
rpop key

# 获取索引位置的value o(n) 级别
lindex key index  

# 将范围内的元素保留下来，其余删除 o(n)
ltrim key start end

# 获取范围的 value,index 为 -1 时标记获取最后一个元素位置  o(n)
lrange key start end
```

#### set

```bash
# 往 set 中添加成员
sadd key member
# 返回添加成功的个数，返回 3
sadd test2 1 2 3
# 返回 0
sadd test2 3

# 获取 key 所有的成员
smembers key

# 判断某个 value 是否存在
sismember key value

# 获取有多少个 member
scard key
scard test2

# 弹出一个 member 
spop key count
# 将 test2 中弹出两个 member
spop test2 2
```

#### zset

```bash
# 设置成员的分数
zadd key score member

# 获取指定索引范围的数据 
zrange key start end

# 逆序获取指定索引的数据 
zrevrange key start end

# 获取 key 中 member 的数量 
zcard key

# 获取排名，排名从 0 开始
zrank key member

# 根据分值获取 member
zrangebyscore book5 8 10

# 删除 member
zrem key member
```



##  高级数据类型

### 位图 Bitmap

可以用于统计数据

比如说签到，一年365天，365 bit 就可以记录一个人的签到

```bash
# 注意偏移量太大，可能会耗内存
setbit key offset value
getbit key offset
bitcount key [start end]

# 对多个 Bitmap 的 and(交集)/or（并集）/not（非）/xor（异或） 操作病将结果保存在 destkey
bitop op destkey key [key...]
```

### HyperLogLog

实质是字符串，利用算法。常用统计，统计误差 0.81%，占用12KB

```bash
# 添加元素
pfadd key element

# 统计 key 数量
pfcount key

# 将多个 sourcekey 合并到目标 key
pfmerge destkey sourcekey
```

### 布隆过滤器

### GeoHash

存储经纬度。底层 zset

```bash
# 添加多个经纬度
geoadd key longitude latitude member [longitude latitude member]

# 获取 member 的经纬度
geopos key member [member ...]

# 获取两个经纬度之间的距离，可以指定单位 unit:m(米)，km(千米)，mi(英里)，ft(尺)
geodist key member1 member2 [unit]

```


## 功能

### pipeline

n 次时间 =n次网络时间+n次命令时间

pipeline 可以将一批命令，发送redis，返回对应命令结果

1次pipeline 时间=1次网络时间+n次命令时间

注意 pipeline 携带的数据量

### 发布订阅

发布者，订阅者，频道

没有消息堆积的能力。

```bash
# 发布消息
publish
publish sohu:tv "hello world"

# 订阅消息
subscribe
subcribe sohu:tv

# 取消订阅
unsubscribe
unsubcribe sohu:tv

# 根据正则订阅频道
psubscribe 

# 根据正则取消订阅
punsubcribe
```

## Redis 持久化

### RDB

通过命令此时 Redis 快照保存 RDB 文件中。

save 命令同步保存快照数据，生成 RDB 文件，其余命令要排队等待 save 执行成功。考虑阻塞问题。新数据文件替换旧的数据。

bgsave 命令异步保存数据。使用 fork 生成一个子进程，用于生成 RDB 文件，不会阻塞客户端命令。新文件替换旧文件。

也支持自动配置条件触发。多少秒触发数据改变会触发 bgsave。

rdb 文件命名 dump-${port}.rdb

dir 指定文件储存位置。

RDB 缺点：耗时，会丢失数据。fork() 产生子进程，会占用内存。

### AOF

将执行命令写入到 aof 命令。

将命令根据写入策略写入（fsync）到缓存区中。

- always 每条命令都会写入到 aof 文件中。不丢失数据。
- everysec 每秒把缓冲区 中的记录命令写入到 aof 文件。主进程会阻塞命令执行，将需要写入的命令刷盘。
- no 由系统调用。不使用这个。

![image-20200215035830345](http://oss.mflyyou.cn/blog/20201005231659.png?author=zhangpanqin)

- bgrewriteaof fork 子进程对当前内存数据进行分析然后重写 aof 文件，而不是整理 aof 文件。

    ![image-20200215040332598](http://oss.mflyyou.cn/blog/20201005231706.png?author=zhangpanqin)

```txt
appendonly yes 
appendfilename appendonly-${port}.aof
appendfsync everysec
```

![image-20200215041246924](http://oss.mflyyou.cn/blog/20201005231712.png?author=zhangpanqin)

### RDB 和 AOF 配置

RDB 和 AOF 属于 CPU 密集型。不做 CPU 绑定。



### Docker

```bash
docker run --name slave-redis-6380 -h 0.0.0.0 -p 6380:6380 -d --restart=always redis redis-server
```



## 运维优化

```bash
# 查看内存信息
info memory 
info:latest_fork_usec
```

## 哨兵模式

sentinel 是特殊的redis .redis-sentinel 启动 sentinel节点。



sentinel 通过定时 info replication 获取 master 节点信息，通过解析知道 slave 节点信息，再去 info slave。

sentinel 通过发布订阅一个 chanel 进行通信，交换选举信息，判定master 是否不可用。

sentinel 通过 1秒 ping 每个 redis 确定 redis 是否健康。 

![image-20200216022528544](http://oss.mflyyou.cn/blog/20201005231719.png?author=zhangpanqin)



![image-20200216023522450](http://oss.mflyyou.cn/blog/20201005231724.png?author=zhangpanqin)

![image-20200216023825223](http://oss.mflyyou.cn/blog/20201005231730.png?author=zhangpanqin)

```txt
port 26379

daemonize yes

pidfile "/var/run/redis-sentinel-26379.pid"

logfile "redis-sentinel-26379.log"

dir "/private/tmp/26379"

sentinel myid 03934003fa9be3c2dfd7bd954685873a9ce0dfad
# 30秒
sentinel deny-scripts-reconfig yes

# 从节点链接新的主节点的并发数
sentinel monitor mymaster 127.0.0.1 6379 2
```

##  redis cluster 集群模式

集群模式下，每个主节点是可以读写的，从节点不会参与读写，访问从节点读时，会跳转到其主节点。可以在来接从节点的时候，执行 readonly 可以在从节点进行读写。但是断开连接之后，在连接还需要执行 readonly 命令。



### 集群步骤

- 开启节点模式（cluster-enabled yes）
- redis-server 启动所有几点
- 节点之间相互 meet 握手

```bash
# 几点之间相互通信
cluster meet ip port
```

- 分配槽（共 16383 个）

```txt
cluster addslots start end
```

- 主从复制

```txt
cluster replicate ${node-id}
```

### 配置文件

```txt
port 6379
daemonize yes
pidfile /var/run/redis_6379.pid
dbfilename dump-6379.rdb
dir /usr/local/var/db/redis/
# 开启集群模式
cluster-enabled yes
# 节点信息持久化文件
cluster-config-file nodes-6379.conf
cluster-require-full-coverage no
```

```bash
# 查看当前节点信息
cluster info
# 查看所有节点
cluster nodes
```

### 命令创建集群关系

```bash
redis-cli --cluster create 127.0.0.1:6382 127.0.0.1:6380 127.0.0.1:6381 127.0.0.1:26379 127.0.0.1:26380 127.0.0.1:26381 --cluster-replicas 1
```



### 数据迁移





![image-20200216074100621](http://oss.mflyyou.cn/blog/20201005231736.png?author=zhangpanqin)

### 集群模式使用 

```bash
# redis-cli -c -p ${port} -c 指定集群模式，客户端会计算 key 的槽位置，跳转到对应节点上操作
redis-cli -c -p 4380

#  查看节点信息
cluster nodes

# 计算 key 的槽位置 
cluster keyslot key

# 查看槽的信息
cluster slots
```

### 重定向

- moved 重定向，槽已经迁移。
- ask 重定向，槽可能迁移，可能没有迁移

### 故障转移

- 节点之间 ping/pong 消息通信

- 主观下线

    ![image-20200216190723545](http://oss.mflyyou.cn/blog/20201005231740.png?author=zhangpanqin)



- 客观下线

![image-20200216190839732](http://oss.mflyyou.cn/blog/20201005231745.png?author=zhangpanqin)



## Redis 慢查询

```conf
# 配置小于多少微妙的时候，判定为慢查询，默认 10000微妙，10毫秒
slowlog-log-slower-than 
# 慢查询列表长度，默认128
slowlog-max-len
# 当需要重启 redis 的时候，我们可以在配置文件配置
# 推荐设置，队列长度
config set slowlog-max-len 1000
# 推荐设置， 1ms
config set slowlog-log-slower-than 1000
```

## Redisson

###锁

[Redisson 锁]([https://github.com/redisson/redisson/wiki/8.-%E5%88%86%E5%B8%83%E5%BC%8F%E9%94%81%E5%92%8C%E5%90%8C%E6%AD%A5%E5%99%A8](https://github.com/redisson/redisson/wiki/8.-分布式锁和同步器))

- 可重入锁

```java
RLock lock = redisson.getLock("anyLock");
// 最常见的使用方法
lock.lock();
// 加锁以后10秒钟自动解锁
// 无需调用unlock方法手动解锁
lock.lock(10, TimeUnit.SECONDS);

// 尝试加锁，最多等待100秒，上锁以后10秒自动解锁
boolean res = lock.tryLock(100, 10, TimeUnit.SECONDS);
if (res) {
   try {
     ...
   } finally {
       lock.unlock();
   }
}
```

- 公平锁

```java
RLock fairLock = redisson.getFairLock("anyLock");
// 最常见的使用方法
fairLock.lock();
```

- 联锁（获取多个锁才能执行）

```java
RLock lock1 = redissonInstance1.getLock("lock1");
RLock lock2 = redissonInstance2.getLock("lock2");
RLock lock3 = redissonInstance3.getLock("lock3");

RedissonMultiLock lock = new RedissonMultiLock(lock1, lock2, lock3);
// 同时加锁：lock1 lock2 lock3
// 所有的锁都上锁成功才算成功。
lock.lock();
...
lock.unlock();

RedissonMultiLock lock = new RedissonMultiLock(lock1, lock2, lock3);
// 给lock1，lock2，lock3加锁，如果没有手动解开的话，10秒钟后将会自动解开
lock.lock(10, TimeUnit.SECONDS);

// 为加锁等待100秒时间，并在加锁成功10秒钟后自动解开
boolean res = lock.tryLock(100, 10, TimeUnit.SECONDS);
...
lock.unlock();
```

- 红锁

```java
RLock lock1 = redissonInstance1.getLock("lock1");
RLock lock2 = redissonInstance2.getLock("lock2");
RLock lock3 = redissonInstance3.getLock("lock3");

RedissonRedLock lock = new RedissonRedLock(lock1, lock2, lock3);
// 同时加锁：lock1 lock2 lock3
// 红锁在大部分节点上加锁成功就算成功。
lock.lock();
...
lock.unlock();
```

- 读写锁（ReadWriteLock）

```java
RReadWriteLock rwlock = redisson.getReadWriteLock("anyRWLock");
// 最常见的使用方法
rwlock.readLock().lock();
// 或
rwlock.writeLock().lock();

// 10秒钟以后自动解锁
// 无需调用unlock方法手动解锁
rwlock.readLock().lock(10, TimeUnit.SECONDS);
// 或
rwlock.writeLock().lock(10, TimeUnit.SECONDS);

// 尝试加锁，最多等待100秒，上锁以后10秒自动解锁
boolean res = rwlock.readLock().tryLock(100, 10, TimeUnit.SECONDS);
// 或
boolean res = rwlock.writeLock().tryLock(100, 10, TimeUnit.SECONDS);
...
lock.unlock();
```

- ###### Semaphore

```java
RSemaphore semaphore = redisson.getSemaphore("semaphore");
semaphore.acquire();
//或
semaphore.acquireAsync();
semaphore.acquire(23);
semaphore.tryAcquire();
//或
semaphore.tryAcquireAsync();
semaphore.tryAcquire(23, TimeUnit.SECONDS);
//或
semaphore.tryAcquireAsync(23, TimeUnit.SECONDS);
semaphore.release(10);
semaphore.release();
//或
semaphore.releaseAsync();
```

- CountDownLatch

```java
RCountDownLatch latch = redisson.getCountDownLatch("anyCountDownLatch");
latch.trySetCount(1);
latch.await();

// 在其他线程或其他JVM里
RCountDownLatch latch = redisson.getCountDownLatch("anyCountDownLatch");
latch.countDown();
```

