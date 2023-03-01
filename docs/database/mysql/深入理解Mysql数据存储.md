---
title: 深入理解Mysql数据存储
---

## 前言

### 本文内容

-   Mysql 数据文件说明
-   Mysql 数据逻辑存储架构
-   Mysql 表空间，主要是系统表空间和独立表空间
-   Mysql 数据类型
    -   时区对 datetime 和 timestamp 影响，java 中 LocalDatetime 保存时，时间和预期不符的原因分析和解决办法
    -   varchar(n) 和 char(n) 保存时，n 能取多少，n 的含义。一行数据中 varchar 能存多少个
    -   整型、小数

本文内容基于 Mysql 8.0.21 ，系统为 Centos 7。

## Mysql 架构说明

![https://dev.mysql.com/doc/refman/8.0/en/images/mysql-architecture.png](http://oss.mflyyou.cn/blog/20200920151544.png?author=zhangpanqin)

客户端链接 **Mysql** 的 **Server** 层，Server 层会对 sql 进行语法解析和优化并生成**执行计划**，然后调用**存储引擎**提供的接口获取要查询的数据。

存储引擎层从计算机文件系统上读取对应的文件中的数据返回给 Server 层，Server 层再将数据返回给客户端。

存储引擎不了解的话，使用 `InnoDB` 就行，这也是比较常用的。

Redis 为什么会比 Mysql 快，很大的原因是 Redis 的数据都在内存中，再加上比较好的数据结构，查询的速度当然不是一个量级的。但同时 Redis 不会存储那么多的数据量，几个 T 的内存还是挺贵的。

Mysql 将数据储存在硬盘上，为了提高查询速度，比较好的做法是将索引数据和一部分热数据（经常访问的数据）放到内存中（Mysql 的 **Buffer Poll**）。

当检索数据的时候，Mysql 通过索引查找，就可以知道数据在磁盘哪块了，从硬盘对应位置读取对应的数据到内存中返回给客户端。

如果查询的时候没有走索引就需要扫描整个表数据文件，因为内存比硬盘小，会不停的从硬盘读取表中的一部分数据到内存，然后在内存中筛选出符合要求的数据，再去硬盘读取一部分数据做筛选直到整个表数据读取一遍。如果你有 20 g 数据，你想一下需要读取多长时间。

Mysql 8.0 相对 Mysql 7.0 性能上有很大提升，条件允许建议使用 Mysql 8.0。

## Mysql 数据存储

### 连接 Mysql

```bash
# -h 指定 mysqld 的服务地址
# -P 指定连接端口
# -u 执行用户（生产环境不建议使用 root 用户连接，合理使用权限管理。每个库使用不同的账号密码）
# -p 输入密码
mysql -hlocalhost -P3306 -uroot -p
```

### 查看 Mysql 数据文件的目录

```sql
-- 连接之后输入以下命令，查看数据储存在哪里了
-- /var/lib/mysql/  Centos 7.0 存储位置
show variables like '%datadir%';

```

### 系统表空间

系统表空间是所有表共享的，它保存了数据表结构，事务信息 等

```sql
SHOW VARIABLES LIKE 'innodb_data_file_path%'
-- ibdata1:12M:autoextend
```

### 独立表空间

独立表空间是指每张表单独用一个文件储存每张表对应的数据和索引，文件扩展名为 ibd。

每个数据库会有一个对应目录用于保存当前数据库中的数据文件

```txt
在 /var/lib/mysql/ 目录下
drwxr-x---    8 zhangpanqin  admin   256B  2 11  2020 leetcode
drwxr-x---    8 zhangpanqin  admin   256B 10 18  2019 mysql
-rw-r-----    1 zhangpanqin  admin    36M 11 29 18:31 mysql.ibd
```

当我们在某个数据库中创建一张表时，除了在系统表空间生成元数据和表结构，也会在对应的数据库目录下，新建一个 tablename.ibd 文件。

```txt
/usr/local/var/mysql/leetcode

-rw-r-----  1 zhangpanqin  admin   112K  2 11  2020 department.ibd
-rw-r-----  1 zhangpanqin  admin   112K  2 11  2020 employee.ibd
-rw-r-----  1 zhangpanqin  admin   112K  2 11  2020 logs.ibd
-rw-r-----  1 zhangpanqin  admin   112K  2 11  2020 person.ibd
-rw-r-----  1 zhangpanqin  admin   112K  2 14  2020 scores.ibd
-rw-r-----  1 zhangpanqin  admin   112K  2 11  2020 weather.ibd
```

**Mysql 8.0 是默认开启独立表空间的**，默认每张表使用一个文件进行保存数据和索引

```sql
-- 查看是否开启独立表空间配置
mysql> show variables like '%innodb_file_per_table%';
+-----------------------+-------+
| Variable_name         | Value |
+-----------------------+-------+
| innodb_file_per_table | ON    |
+-----------------------+-------+
```

## InnoDB 逻辑储存结构

![image-20200921113000653](http://oss.mflyyou.cn/blog/20200921183000.png?author=zhangpanqin)

### 表空间

在 `InnoDB` 存储引擎下，表相关的所有数据（比如业务数据和索引数据）都储存在**表空间（tablespace）**中。每张表都有一个自己的文件（.ibd）去储存相关数据（开启独立表空间设置）。

表空间又可以细分为 `segment`，`extent`，`page`，`row`。

### 段

表空间又包含多个段（segment），常见的数据段有：

-   `Leaf node segment` 数据段，存储当前表中的数据
-   `Non-Leaf node segment` 索引段，存储当前表中的索引

### 区

段包含很多个区，每个区始终为 1MB 。区由多个连续连续的页组成，页的大小通常是 16KB，所以一个区可以有 64 （1024/16=64）个连续页。

### 页

**页是 `InnoDB` 与磁盘交互的最小单位**。从磁盘上读取数据，一次性是读取一页数据。将内存中的数据落盘到硬盘上，也是操作一页数据。

比如我们修改了 `id=3` 某行数据，数据持久化的时候，是需要将这行所在的页全部落盘在硬盘上。

```sql
update test_table set a=2 where id =3;
```

页也有类型，数据页，索引页等等。

```sql
-- 查看页的大小，默认是 16KB =16*1024bit
mysql> show variables like '%innodb_page_size%';
+------------------+-------+
| Variable_name    | Value |
+------------------+-------+
| innodb_page_size | 16384 |
+------------------+-------+
```

### 行

每页存放一行一行的数据。

```sql
mysql> SHOW TABLE STATUS LIKE "test_data_type"\G;
*************************** 1. row ***************************
           Name: test_data_type
         Engine: InnoDB
        Version: 10
     Row_format: Dynamic
           Rows: 22
 Avg_row_length: 14894
    Data_length: 327680
Max_data_length: 0
   Index_length: 0
      Data_free: 0
 Auto_increment: 243
    Create_time: 2020-09-21 01:55:51
    Update_time: 2020-09-21 02:06:59
     Check_time: NULL
      Collation: utf8mb4_0900_ai_ci
       Checksum: NULL
 Create_options:
        Comment:
```

`Row_format` 定义了一行数据在数据页中怎么保存。

![image-20200921120326750](http://oss.mflyyou.cn/blog/20200921190326.png?author=zhangpanqin)

**VARCHAR(M)** 和 **TEXT** 类型的字段为变长字段，变长字段占用多少字节，记录在 `变长字段长度列表`

记录头信息中，记录着当前行的类型和下一条记录位置等信息。

行数据中，除了我们表结构中自己定义的字段，还有 Mysql 添加的元数据字段。比如 `行 id`（当没有主键数据的时候添加），事务 id （主要用于 MVCC）和 回滚指针等。

一页可以存 16KB 数据，但是 VARCAHR(m)，可以存 65535 字节。这些变长数据大于一页需要怎么存呢。这个现象也叫做行溢出。

行溢出的数据会单独存在一页中，在真实数据中对应的列中记录一个指针指向溢出的数据。

<font color=red>**以上内容了解即可，只是为了理解原理及辅助表设计。**</font>

## 数据类型

<font color=red> **表设计的时候一定要选取合适的数据类型，能用数字就不要用字符串，一是减少存储时空间的浪费，二是减少查询时内存的浪费。**</font>

### 整型

| 类型     | 描述               | 占用字节 | 范围                                                                                    |
| -------- | ------------------ | -------- | --------------------------------------------------------------------------------------- |
| tinyint  | 对应 java 中 byte  | 1 字节   | 有符号-128 至 127。<br>无符号 0 至 255                                                  |
| smallint | 对应 java 中 short | 2 字节   | 有符号 -32768 至 32767。<br>无符号 0 至 65535                                           |
| int      | 对应 java 中 int   | 4 字节   | 有符号 -2147483648 至 2147483647。<br>无符号 0 至 4294967295                            |
| bigint   | 对应 java 中 long  | 8 字节   | 有符号 -9223372036854775808 至 9223372036854775807 <br>无符号 0 至 18446744073709551615 |

### 小数

| 类型          | 描述                                              | 占用字节    |
| ------------- | ------------------------------------------------- | ----------- |
| FLOAT(M, D)   | 对应 java 中 float                                | 4 字节      |
| DOUBLE(M, D)  | 对应 java 中 double                               | 8 字节      |
| DECIMAL(M, D) | 对应 java 中 BigDecimal。定点数，可以精确保存小数 | M 和 D 决定 |

`M` 表示小数的有效数字，`D` 表示小数点后的有效数字。

FLOAT(4, 1) 不能存 4000.1 会报错误。

### 日期和时间

| 类型           | 描述                                                             | 占用字节 | 取值范围                                                |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------------------------------------------- |
| YEAR           | 年份                                                             | 1 字节   | 1901~2155                                               |
| DATE           | 日期，年月日                                                     | 3 字节   | 1000-01-01~ 9999-12-31                                  |
| TIME(fsp)      | 时间，时分秒                                                     | 3 字节   | -838:59:59.000000 ~ 838:59:59.000000                    |
| DATETIME(fsp)  | 日期+时间                                                        | 5 字节   | 1000-01-01 00:00:00.000000 ~ 9999-12-31 23:59:59.999999 |
| TIMESTAMP(fsp) | 底层存储的是 UTC 时间戳，<br>显示值会随 mysql 数据库所在时区变化 | 4 字节   | 1970-01-01 00:00:01.000000 ~ 2038-01-19 03:14:07.999999 |

`TIMESTAMP(fsp) ` 中的 **fsp** 是指秒的精度(x.xxx xxx)，**fsp**取值 0，1，2，3，4，5，6。

`TIME`、`DATETIME`、`TIMESTAMP` 这几种类型支持小数秒。

`DATETIME(0)` 精确到秒，没有小数位。

`DATETIME(3)` 精确到豪秒，有三位小数。

<font color=red>**日期和时间存储时区的设置有关，一定要搞清楚原理。 **</font>

**TIMESTAMP** 的显示和数据库系统设置的时区有关。**TIMESTAMP** 底层实际存储的是毫秒值，显示的时间是根据设置的时区（**time_zone**）转换为时间显示的。

还有 Java 1.8 新增的 `LocalDateTime` 需要怎么转换 `Mysql` 中的时间呢。

```sql
-- 查看 mysql 的时区设置
SHOW VARIABLES LIKE "%time_zone%";
```

```txt
mysql> SHOW VARIABLES LIKE "%time_zone%";
+------------------+--------+
| Variable_name    | Value  |
+------------------+--------+
| system_time_zone | CET    |
| time_zone        | +08:00 |
+------------------+--------+
```

`system_time_zone` 是 ` Mysql` 启动的时候获取计算机系统所在的时区。只要计算机的时间准确就没有问题。

`time_zone` 设置的是连接 mysql 的会话中，时间 （java.util.Date）转换为字符串时的 TimeZone。`time_zone` 这个值可以被 jdbc 连接中的 `serverTimezone=Asia/Shanghai` 覆盖。

因为我们是在东八区，希望时间都转换为东八区时间。

```mysql
[mysqld]
# 将时间转换为东八区的时间
default-time-zone = '+08:00'
```

```sql
CREATE TABLE `test_data_type` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `test_data_time` datetime DEFAULT NULL,
  `test_timestamp` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=243 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

-- 实际保存数据的时候需要将日期转换为字符串，拼接成这样的 sql
INSERT INTO test_data_type (test_data_time,test_timestamp) VALUES ('2020-12-12 12:12:12','2020-12-12 12:12:12');
```

比如我们将 java 中的 `LocalDateTime` 存为 datetime 类型。

```java
@Data
@TableName(value = "test_data_type")
public class TestDataType {
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField(value = "test_data_time")
    private LocalDateTime testDataTime;

    @TableField(value = "test_timestamp")
    private LocalDateTime testTimestamp;
}
```

当我们保存数据的时候，需要根据配置的 time_zone,将 LocalDateTime 转为 String，在替换到 sql 中的 `?`

```sql
INSERT INTO test_data_type (test_data_time,test_timestamp) VALUES (?,?);
```

```sql
// NativeProtocol.configureTimezone 可以看到这个逻辑
@Test
public void run33() {
	// 首先获取到在服务器设置的 time_zone，如果没有设置的话，默认取 mysql 服务器所在时区
	String configuredTimeZoneOnServer = this.serverSession.getServerVariable("time_zone");
	// jdbc 链接中设置的参数
	String canonicalTimezone = getStringProperty("serverTimezone");
	if(canonicalTimezone==null||canonicalTimezone.length()<0){
		canonicalTimezone=configuredTimeZoneOnServer;
	}
	// jdbc url 参数中配置的 serverTimezone 和 time_zone 都是为了获取 TimeZone，serverTimezone 的优先级更高
 	final TimeZone timeZone = TimeZone.getTimeZone(canonicalTimezone);
 	// Timestamp 继承了 java.util.Date
 	// 这里会将获得 LocalDateTime 获取其年月日时分秒上的值
    final Timestamp timestamp = Timestamp.valueOf(LocalDateTime.now());
    final SimpleDateFormat simpleDateFormat = new SimpleDateFormat();
    simpleDateFormat.applyPattern("yyyy.MM.dd HH:mm:ss");
    simpleDateFormat.setTimeZone(timeZone);

	// 然后将这个 time 替换 ？
   	String time= simpleDateFormat.format(timestamp);
}
```

#### 时区设置结论

<font color=red>**当我们保存数据的创建时间的时候，只需获取当前时间就行。当前时区与东八区的时差，mysql 配置的 `time_zone`和 `serverTimezone` 转换成字符串时会自动加上。**</font>

```java
final Date createTime = new Date();
// LocalDateTime 一定不要自己补时差，不然时间会对不上
final LocalDateTime createTime2 = LocalDateTime.now();
// 下面这个用法是错误的。这样数据库中保存的时间比实际时间多了八个小时
final LocalDateTime errorCreateTime =  LocalDateTime.now(ZoneId.of("UTC+8"));
```

### 字符串

#### varchar

varchar (M) 中 M 指的是字符数。<font color=red>**Mysql 限制在一行数据中，所有 varchar 列的总字节数不能超过 65535 字节。** </font>

```sql
-- utf8mb4 实际会占用 1-3 字节
CREATE TABLE `test_varchar`  (
  `test_name` varchar(65535) CHARACTER SET utf8mb4  NOT NULL
) ENGINE = InnoDB CHARACTER SET = utf8mb4;
```

执行上述 sql 报错为：

```txt
1074 - Column length too big for column 'test_name' (max = 16383); use BLOB or TEXT instead, Time: 0.000000s
```

验证所有 varchar 列总数据不能超过 65535

```sql
CREATE TABLE `test_varchar`  (
  `test_name1` varchar(7000) CHARACTER SET utf8mb4  NOT NULL,
	`test_name2` varchar(7000) CHARACTER SET utf8mb4  NOT NULL,
	`test_name3` varchar(7000) CHARACTER SET utf8mb4  NOT NULL
) ENGINE = InnoDB CHARACTER SET = utf8mb4;
```

执行上述 sql 报错信息为

```txt
1118 - Row size too large. The maximum row size for the used table type, not counting BLOBs, is 65535. This includes storage overhead, check the manual. You have to change some columns to TEXT or BLOBs, Time: 0.002000s
```

varchar (M) 实际占用字节数，除了数据的占用，还有数据字节数大小的记录（1-2 字节）。

<font color=red>**varchar(255) 存储的 abc 的时候占用 4 个字节，但是这个数据加载到内存的时候是占用定义的时候指定的字节数 （255\*3 utf8 编码）所以这个数值不要随便填写**</font>

#### char

char(M) M 也是指的字符数，列采用的字符集不同，char 类型数据占用大小也不一样。char 类型的数据没有达到指定字符数，数据库会自动补充空格，返回数据的时候在去掉空格。

当一个字符串太长的时候一定要采取 text 类型的数据，text 类型的数据存储的时候会作为行溢出数据存储，就没有 65535 大小的限制。

```txt
// 可以看到占用
https://dev.mysql.com/doc/refman/8.0/en/storage-requirements.html
```

| 数据类型                 | 总字节数                                                                                                   | 内容字节 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- | -------- |
| VARCHAR(M)、VARBINARY(M) | L+ 1 bytes if column values require 0 − 255 bytes,<br>L+ 2 bytes if values may require more than 255 bytes |          |
| TINYBLOB 、TINYTEXT      | L+1                                                                                                        | L<2^8    |
| BLOB、TEXT               | L + 2                                                                                                      | L<2^16   |
| MEDIUMBLOB、MEDIUMTEXT   | L+ 3                                                                                                       | L<2^24   |
| LONGBLOB、LONGTEXT       | L+ 4                                                                                                       | L<2^32   |
