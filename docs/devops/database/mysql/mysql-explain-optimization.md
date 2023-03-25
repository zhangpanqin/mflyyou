---
title: Mysql优化及问题定位,看这一篇就够了
---

## Mysql 系列博客

[面试必问的 Mysql 事务和锁,你真的了解吗?【原创】](https://mp.weixin.qq.com/s/GOOrKcicwzpZUMb70kZcIA)

[深入了解 Mysql 索引【原创】](https://mp.weixin.qq.com/s/EtaBDwvN60yEeEh6_-qIWg)

[深入理解 Mysql 数据存储【原创】](https://mp.weixin.qq.com/s/hnJE6CkjXSXS3FatG11E3Q)

[Mysql 权限管理【原创】](https://mp.weixin.qq.com/s/WbilZ1mxH9u9YXflRpkccQ)

[Mysql 数据备份与恢复【原创】](https://mp.weixin.qq.com/s/JkB4z1a7fTSCAObnk-x7pw)

## 前言

我最近由于换工作，博客更新暂缓，后面争取一周两篇。

Mysql 系列到这里就差不多了，Mysql 集群、分库分表及分布式事务由于我还是停留在理论上，没在生产环境上玩过，又怕写不好，这部分内容我会在有底气的一天回来补上来。

下一个系列，想写 java 相关的，java 虚拟机及问题定位，java 并发，java 源码等等。

### 本文内容

-   explain 查看执行计划
-   show profile 定位问题
-   硬件的选择及 mysql 使用内存估计

Mysql 单机扛不住的时候，考虑读写分离，主库用于写，从库用于查。主要还是为了减小 insert/update/delete 锁开销降低了数据库的并发。

当业务量级真的达到需要分库分表的时候，数据库上云吧。上云的花费对于业务盈利来说估计也就是九牛一毛了。

数据库上云之后，运维也比较方便了。

## Cpu/内存/硬盘选择

### 内存

你如果给 Mysql 配置的内存较高，将其当成一个内存数据库使用（索引数据和业务数据都在内存中），那么其性能一定不会差。

内存较大的服务器价格不菲，我们要选择合适的内存大小。

一般我们倾向于将索引数据和一部分访问频率比较频繁的热数据放入到内存中就可以了，但是还是要预留出来一部分内存，防止发生 swap 降低性能。当下图中的 swap 中 si 和 so 为 0 就行了。代表系统没有发生 swap。当你内存较小的时候发生 swap 对性能影响是不小的。

```shell
vmstat -t 1 1000
```

![image-20210306180141644](/blog/20210306180141.png?author=zhangpanqin)

再不发生 swap 的前提下，一般推荐将系统内存的 80% 的内存分配给 mysql 使用。

![公式来推算和配置数据库合适的总内存](/blog/20210306184304.PNG?author=zhangpanqin)

```txt
图片来自 《MySQL数据库频繁出现OOM问题该如何化解》 https://www.huaweicloud.com/zhishi/19122601.html
```

```txt
// 计算 mysql 内存数值大小
https://www.mysqlcalculator.com/
```

`innodb_buffer_pool_size`

实际中主要关心的还是 `innodb_buffer_pool_size` （主要用于缓存业务数据和索引数据）配置，以下是一些参考设置。

典型值为 5-6GB（8GB RAM），20-25GB（32GB RAM），100-120GB（128GB RAM）。

`key_buffer_size` 默认 8M

```txt
show global status like 'key_read%';

Key_read_requests:	0
Key_reads:	0
```

key_cache_miss_rate = Key_reads / Key_read_requests \* 100%;

key_cache_miss_rate 在 0.1%以下都很好(每 1000 个请求有一个直接读硬盘)

`max_connections` 最大连接数默认是 151 。

一般我们都是使用线程池，这个值也不太需要调多大，当你 mysql 实例上有很多个数据库供多个项目使用的时候需要调整这个值。

`read_buffer_size` 默认 128 KB

内存足够大的时候，推荐设置为 1M，这样读取扫描表数据的时候会更快。但也不是越大越好。

`read_rnd_buffer_size` 默认 256 KB

`sort_buffer_size` 默认 256 KB

`join_buffer_size` 默认 256 KB

### 硬盘

数据库的瓶颈主要还是磁盘 io 这一块，SSD 性能相对来说会更好一些。

Mysql 数据的文件还是需要放到 SSD 上的。

当你定时备份数据库数据的时候，可以将备份的数据压缩发送到另一个存储型服务器。

### Cpu

当 cpu 总是 100% 的时候你就需要考虑增加 cpu 的核数了。

一般我们选择 4 核 8g 内存，8 核 16g，16 核 64g ，32 核 128 g 内存 。

#### 查看数据库中数据和索引大小

information_schema.TABLES 保存数据了数据表中的数据大小和索引大小。

```sql
SELECT
	ts.TABLE_SCHEMA AS '数据库',
	CONCAT( ROUND( SUM( ts.DATA_LENGTH / 1024 / 1024 ), 2 ), 'MB' ) AS '总数据大小',
	CONCAT( ROUND( SUM( ts.index_length / 1024 / 1024 ), 2 ), 'MB' ) AS '索引数据大小',
	CONCAT( ROUND( SUM( ( ts.index_length + ts.DATA_LENGTH ) / 1024 / 1024 ), 2 ), 'MB' ) AS '索引数据大小'
FROM
	information_schema.TABLES AS ts
WHERE
	ts.TABLE_SCHEMA NOT IN ( 'mysql', 'information_schema', 'performance_schema' )
GROUP BY
	ts.TABLE_SCHEMA;
```

![image-20210306230137102](/blog/20210306230137.png?author=zhangpanqin)

内存的容量小于索引数据的时候，需要考虑增加内存容量。

## 定位慢 sql

1、druid 连接池也是可以打印慢 sql。一般执行时间长于 1s 的都要优化。

```yaml
spring:
  datasource:
  	druid:
  	 filter:
  	 	stat:
          enabled: true
          # 执行时间小于 1 秒记录为慢 sql
          slow-sql-millis: 1000
          log-slow-sql: true
          db-type: mysql
          merge-sql: true
```

logback 配置

```xml
<!-- druid sql 日志追踪器   -->
<appender name="druidSqlRollingFile" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>${logPath:-${defaultLogPath}}/druid/druid-sql.log</file>
    <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
        <fileNamePattern>${logPath:-${defaultLogPath}}/druid/druid-sql.%d{yyyy-MM-dd}.%i.log
        </fileNamePattern>
        <maxFileSize>${LOG_FILE_MAX_SIZE:-10MB}</maxFileSize>
        <maxHistory>${LOG_FILE_MAX_HISTORY:-20}</maxHistory>
    </rollingPolicy>
    <encoder>
        <pattern>${FILE_LOG_PATTERN}</pattern>
        <charset>UTF-8</charset>
    </encoder>
</appender>
<logger name="druid.sql.Statement" level="warn" additivity="false">
    <appender-ref ref="CONSOLE"/>
    <appender-ref ref="druidSqlRollingFile"/>
</logger>
```

2、mysql 的慢 sql 日志，从这个慢 sql 日志文件中分析出执行慢的 sql

默认是不开启慢 sql 日志记录的

```sql
-- 查看开启慢 sql
show variables like 'slow_query_log%';
-- 查看执行时间大于多少为慢 sql
show variables like 'long_query_time%';
```

![image-20210307151402651](/blog/20210307151402.png?author=zhangpanqin)

开启慢 sql 日志记录，这是动态修改，没有持久化，数据库重启就失效了。

```sql
-- 这个值单位是秒，不要设置的太小。不然打印日志太多，我们要先优化哪些执行时间较长的 sql 比如大于 5 秒，大于 10 秒
-- 一步一步优化
set global long_query_time=3;
-- 开启慢 sql 记录
set global slow_query_log=1;
```

我们可以使用 select sleep(5); 来产生慢 sql 。

```sql
# Time: 2021-03-07T07:24:10.757715Z
# User@Host: root[root] @ localhost []  Id:    17
# Query_time: 5.070525  Lock_time: 0.000000 Rows_sent: 1  Rows_examined: 0
SET timestamp=1615101845;
select sleep(5);
```

也可以在 mysql 配置文件中修改,这样数据库重启也是开启的。

```txt
[mysqld]
slow_query_log=1
slow_query_log_file=/var/lib/mysql/slow-log.log
long_query_time=3
```

按 -s 指定按查询时间排序，-t 指定返回多少条记录数，也可以 -g 筛选，类似于 grep 操作。

```shell
mysqldumpslow -s t -t 10  /usr/local/var/mysql/wanguyunxiao-slow.log | more
mysqldumpslow -s t -t 10 -g "left join"  /usr/local/var/mysql/wanguyunxiao-slow.log | more
```

### 慢 sql 产生的原因

1、可能没有用到索引，建立合适的索引

2、有的时候索引也建立了，但是你联合查询，关联 n 多个表查询速度可能慢。阿里规范推荐最多关联 3 个表，这个时候我们就需要简化 sql 了，用多个 sql 完成你的业务逻辑，而不是一条 sql 查询出你需要的数据。

3、sql 一定要写规范，索引的使用要符合最左匹配原则，这和索引的数据结构有关

4、隐式数据类型转换，条件做函数计算等等，这些都要避免

5、还有一种比较特殊，有索引，但是没有做索引，这个时候可以强制走索引，你也要去优化你的索引统计数据。或者优化你的表空间文件了

```sql
-- 实际就是更新索引的统计数据，让索引更有效利用，一般在空闲的时候做。
ANALYZE TABLE table_name;
```

6、表空间文件优化。当我们真删除数据过多，但是数据库的表空间文件可能并没有缩小，这时候我们需要在业务不忙的时候去优化表空间文件。

```sql
-- 会锁表，优化了表空间文件及索引相关的数据。定期执行命令即可。
OPTIMIZE TABLE tbl_name [, tbl_name] ...
```

## Explain 查看执行计划

o 表为组织机构表，字段 id,name

oc 记录的是某个某个组织机构下某个仓库的库存数量，oid,cid,oc_num

```sql
EXPLAIN SELECT o.`name`,t.`库存总量` FROM (SELECT oc.oid,sum(oc.oc_num) AS '库存总量' FROM oc GROUP BY oc.oid HAVING SUM(oc.oc_num)>5000 ) AS t INNER JOIN o ON t.oid=o.id;
```

![image-20210307155802832](/blog/20210307155802.png?author=zhangpanqin)

#### id

sql 执行的顺序标识，序号越大越先执行，相同序号，自上而下执行。

#### partitions

当前查询所用的分区，一般分区表会使用。

#### type，重要关注

访问类型。性能这块

system > const > eq_ref > ref > range > index > ALL

-   ALL

ALL 标识全表扫描，我们要避免全表扫描。

-   index

扫描全部索引数据。

-   range

扫描一部分索引数据。使用索引进行范围查询。一般是 =, <>, >, >=, <, <=, IS NULL, <=>, BETWEEN, IN() 操作中

```sql
SELECT * FROM tbl_name
  WHERE key_column = 10;

SELECT * FROM tbl_name
  WHERE key_column BETWEEN 10 and 20;

SELECT * FROM tbl_name
  WHERE key_column IN (10,20,30);

SELECT * FROM tbl_name
  WHERE key_part1 = 10 AND key_part2 IN (10,20,30);
```

-   ref

查询的时候，条件是普通索引等值查询

```sql
SELECT * FROM ref_table WHERE key_column=expr;

SELECT * FROM ref_table,other_table
  WHERE ref_table.key_column=other_table.column;

SELECT * FROM ref_table,other_table
  WHERE ref_table.key_column_part1=other_table.column
  AND ref_table.key_column_part2=1;
```

-   eq_ref

关联查询的时候，关联的条件使用的是主键或者唯一索引

```sql
SELECT * FROM ref_table,other_table
  WHERE ref_table.key_column=other_table.column;

SELECT * FROM ref_table,other_table
  WHERE ref_table.key_column_part1=other_table.column
  AND ref_table.key_column_part2=1;
```

-   const

使用主键或唯一索引等值查询。

```sql
SELECT * FROM index_test WHERE id =1
```

-   system

表只有一行数据，一般是系统表。

#### possible_keys

当前查询中可能用到的索引。

#### key

当前查询用到的真实索引。当可能走索引插叙，但实际没有用到索引查询，你可能需要去分析表，更新索引统计数据，让索引更有效利用。

```sql
-- 实际就是更新索引的统计数据，让索引更有效利用，一般在空闲的时候做。
ANALYZE TABLE table_name;
```

#### key_len

不损失精确性的前提下，越小越好。

#### ref

哪个字段或常数与 key 一起被使用

#### rows，重点关注

显示此查询一共扫描了多少行，这个是一个估计值。此值越少性能越好。

#### filtered

表示此查询条件所过滤的数据的百分比

#### extra，需要关注

extra 包含 Using filesort 和 Using temporary 考虑优化。

-   Using where

列数据是从仅仅使用了索引中的信息而没有读取实际的行动的表返回的，这发生在对表的全部的请求列都是同一个索引的部分的时候，表示 mysql 服务器将在存储引擎检索行后再进行过滤

-   Useing index

覆盖索引扫描，只扫描了索引数据就拿到了结果。往往性能不错。

-   Using temporary

表示 MySQL 需要使用临时表来存储结果集，常见于排序和分组查询或者多表查询，**需要考虑优化**

-   Using filesort

MySQL 中无法利用索引完成的排序操作称为“文件排序”，**必须优化**

## show profile

show profile 可以看到 sql 执行在哪块比较耗时，cpu/内存/io 等等

```sql
-- 查看 profile 是否开启,默认是关闭的。
show variables like '%profil%';
+------------------------+-------+
| Variable_name          | Value |
+------------------------+-------+
| have_profiling         | YES   |
| profiling              | OFF   |
| profiling_history_size | 15    |
+------------------------+-------+

-- 开启 profile
set profiling=1;

-- 查看已经执行的 sql
SHOW PROFILES;
```

![image-20210307171104670](/blog/20210307171104.png?author=zhangpanqin)

```sql
-- show profile cpu, block io, memory,swaps,context switches,source for query [Query_ID];
-- 查看具体某个执行 sql
show profile cpu, block io, memory,swaps,context switches,source for query [Query_ID];

-- 先执行 SHOW PROFILES;拿到 query_id 在执行下面的 sql
show profile cpu, block io, memory,swaps,context switches,source for query 173;
```

## SHOW PROCESSLIST

查看数据库线程中的状况。

![image-20210307174502849](/blog/20210307174502.png?author=zhangpanqin)

```sql
SHOW PROCESSLIST;
SELECT * FROM information_schema.`PROCESSLIST`;
```

结合 top/vmstat/iostat 可以定位 mysql 中 cpu,io,内存相关问题。

```shell
# 查看 mysqld 的进程
ps -ef | grep mysqld | grep -v grep
# 查看 mysqld 中的线程
top -Hp 5762

# 或者一步到位，查看 mysqld 下的线程
top -Hp `ps -ef | grep mysqld | grep -v grep | awk '{print $2}'`
```

通过以上工具就可以定位 MySQL 具体的信息

## Mysql 系列博客

[面试必问的 Mysql 事务和锁,你真的了解吗?【原创】](https://mp.weixin.qq.com/s/GOOrKcicwzpZUMb70kZcIA)

[深入了解 Mysql 索引【原创】](https://mp.weixin.qq.com/s/EtaBDwvN60yEeEh6_-qIWg)

[深入理解 Mysql 数据存储【原创】](https://mp.weixin.qq.com/s/hnJE6CkjXSXS3FatG11E3Q)

[Mysql 权限管理【原创】](https://mp.weixin.qq.com/s/WbilZ1mxH9u9YXflRpkccQ)

[Mysql 数据备份与恢复【原创】](https://mp.weixin.qq.com/s/JkB4z1a7fTSCAObnk-x7pw)
