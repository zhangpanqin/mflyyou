---
title: Mysql 用户权限管理
---

## 前言

为了避免删库跑路的事情，权限管理和数据备份是必要。

### 机器环境

-   mysql 8.0.21 x86_64 MySQL Community Serve

-   centos 7

## Mysql 权限管理

Mysql 8.0 可以创建角色，然后将操作数据库、表、索引等的权限赋予给角色，将将角色赋予给用户，也是我们熟悉的 RBAC 模型。

当然也可以将权限直接授予用户。

### 用户

#### 创建用户

```sql
-- 用户名称是由 用户名和登录用户的 ip 一同组成的，% 代表任意 ip
CREATE USER 'db_dev'@'localhost' IDENTIFIED BY 'Mysql@12345678';
```

#### 修改用户密码

```sql
-- 修改用户密码
ALTER USER 'test'@'localhost' IDENTIFIED BY 'password';
```

#### 锁定用户

```sql
-- 锁定用户不能登录
ALTER USER 'db_dev1'@'localhost' ACCOUNT LOCK;

-- 解锁
ALTER USER 'db_dev1'@'localhost' ACCOUNT UNLOCK;
```

### 权限

用户的权限信息保存在 `information_schema.USER_PRIVILEGES` 。也可以在 `mysql.user` 看到授权信息。

为了避免已经建立的链接的权限无法刷新，需要搭建数据库的时候，权限就要设计好。

有部分权限是可以动态修改的，但是有的权限，在一个会话中是不能修改的。为了避免问题，需要数据库使用之前就要做好权限规划。

#### 权限说明

[grant 用法](https://dev.mysql.com/doc/refman/8.0/en/grant.html)

| 权限                    | 说明                                                                                                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ALL                     | 所有的权限，除了 [`GRANT OPTION`](https://dev.mysql.com/doc/refman/8.0/en/privileges-provided.html#priv_grant-option) and [`PROXY`](https://dev.mysql.com/doc/refman/8.0/en/privileges-provided.html#priv_proxy). |
| ALTER                   | 修改表结构，[`ALTER TABLE`](https://dev.mysql.com/doc/refman/8.0/en/alter-table.html)                                                                                                                             |
| CREATE                  | 创建数据库和表                                                                                                                                                                                                    |
| DROP                    | 删除数据库、表、视图                                                                                                                                                                                              |
| GRANT OPTION            | GRANT 权限允许你把你自己拥有的那些权限授给其他的用户。可以用于数据库、表和保存的程序。                                                                                                                            |
| DELETE                  | 删除表数据                                                                                                                                                                                                        |
| INDEX                   | INDEX 权限允许你创建或删除索引。                                                                                                                                                                                  |
| INSERT                  | 插入表数据                                                                                                                                                                                                        |
| SELECT                  | 查询表数据                                                                                                                                                                                                        |
| UPDATE                  | 更新表数据                                                                                                                                                                                                        |
| PROCESS                 | show processlist 命令显示在服务器内执行的线程的信息（即其它账户相关的客户端执行的语句）。                                                                                                                         |
| SHOW VIEW               | 查看视图                                                                                                                                                                                                          |
| SHOW DATABASES          | 查看数据库列表，没有授予这个权限，只能查看到 `information_schema`                                                                                                                                                 |
| LOCK TABLES             | 锁表                                                                                                                                                                                                              |
| RELOAD                  | FLUSH 相关的操作                                                                                                                                                                                                  |
| CREATE TABLESPACE       | 允许使用操作表空间和日志的语句，比如创建，删除，修改                                                                                                                                                              |
| CREATE TEMPORARY TABLES | 创建临时表                                                                                                                                                                                                        |

#### 授权

```sql
-- 对从 localhost 登录的用户 db_dev 的数据库：ceshi 中所有表（*） 授予 SHOW DATABASES,SELECT,RELOAD 权限
GRANT SHOW DATABASES,SELECT,RELOAD ON ceshi.* TO 'db_dev'@'localhost';

-- 也可以针对某个表授权，`` 是为了处理关键字，当没有关键字可以 ceshi.test1 就可以
GRANT SELECT ON ceshi.`test1` TO 'db_dev'@'localhost';

-- 刷新权限信息,有的权限是可以动态加载的。为了避免权限出题，每次都执行这个语句
FLUSH PRIVILEGES;
```

#### 回收权限

```sql
-- ON 指定数据库.表
-- FROM 指定用户
REVOKE SHOW DATABASES,SELECT ON *.* FROM 'db_dev'@'localhost';
-- 刷新权限信息
FLUSH PRIVILEGES;
```

### 角色

使用数据库的人员可能有，开发，DBA，运营相关（只会查询数据），程序运行。

#### 角色激活

给用户赋予角色之后，角色默认不激活的。用户可以在会话中激活用户赋予的角色。

也可以设置参数，让所有角色都激活，这样用户登录成功，赋予的角色全选就可以使用了

```sql
-- 查看当前用户下使用了哪些角色
SELECT CURRENT_ROLE();

-- 登录之后激活定义的所有角色，给用户赋予哪些角色，就可以使用这些角色的权限
SET global activate_all_roles_on_login=ON;

-- 在会话中修改激活哪些角色
SET ROLE ops;
```

#### 创建及删除角色

```sql
-- 开发(dev)，db(db)，运营(ops)，程序运行(app_run)
CREATE ROLE 'app_run', 'db', 'ops', 'dev';

-- 删除角色
DROP ROLE 'db', 'app_run';
```

#### 给角色分配权限

-   开发

开发一般会，创建数据库和表，crud，操作索引，修改表结构

drop 权限我建议不要给

```sql
-- crud,创建
GRANT SELECT, INSERT, UPDATE, DELETE,CREATE,CREATE VIEW,ALTER,SHOW DATABASES,SHOW VIEW,ALTER,INDEX,PROCESS,RELOAD,LOCK TABLES ON *.* TO 'dev';
```

-   db

db 一般拥有所有权限

```sql
-- WITH GRANT OPTION 是拥有给用户授权的权限
GRANT ALL PRIVILEGES ON *.* TO 'db' WITH GRANT OPTION;
```

-   运营相关

基本都是查询语句

```sql
-- 或者指定某个具体数据库，或者表
GRANT SELECT,SHOW DATABASES,SHOW VIEW ON *.* TO 'ops';
```

-   程序运行相关

为了使用 flyway 这种可以修改表结构和索引的组件。对权限赋予 CREATE,INDEX,ALTER.

DELETE 语句不要怕，现在 mybatis plus 类似的组件，都带有安全删除的校验，全表删除或者全表更新必须带条件。在一定程度上避免删除表中所有数据。

```sql
GRANT SELECT, INSERT, UPDATE, DELETE,CREATE,CREATE VIEW,SHOW DATABASES,SHOW VIEW,ALTER,INDEX,RELOAD,LOCK TABLES,CREATE TEMPORARY TABLES ON *.* TO 'app_run';
```

#### 给用户赋予角色

```sql
-- 给用户赋予 ops 角色
GRANT 'ops' TO 'db_dev'@'localhost';
```

#### 撤销角色或者角色的权限

```sql
-- 从用户撤销某个角色
REVOKE ops FROM db_dev1@localhost;

-- 从角色中撤销某个权限
REVOKE SHOW VIEW ON *.* FROM 'ops';

-- 刷新权限
FLUSH PRIVILEGES;
```

### 查询用户的权限

```sql
-- 显示来自 localhost 登录的 test 用户
SHOW GRANTS FOR 'test'@'localhost';
SHOW GRANTS FOR 'root'@'%';

-- 来自某个角色 USEING 指定的角色的权限
SHOW GRANTS FOR 'read_user1'@'localhost' USING 'ops';
```

## SSL 访问 Mysql

### 查看链接是否是安全的

```sql
-- 如果未使用 SSL 则 Ssl_cipher 为空
SHOW STATUS LIKE "%Ssl_cipher%"

-- 创建用户只能用于 ssl 链接
CREATE USER 'ssl_test'@'%' IDENTIFIED BY 'Mysql@12345678' REQUIRE X509;
```

与 SSL(X509) 相关的文件在 Mysql 安装的过程中就创建了。

服务器需要 `ca.pem` `server-cert.pem` `server-key.pem`

客户端需要 `client-cert.pem` `client-key.pem`

文件都在数据目录下 `SHOW VARIABLES LIKE '%datadir`

![image-20201123235514374](/blog/20201123235514.png?author=zhangpanqin)

```shell
## 安全方式登录 Mysql
mysql  --ssl-cert=/Users/zhangpanqin/Desktop/client-cert.pem --ssl-key=/Users/zhangpanqin/Desktop/client-key.pem -u ssl_test -h 10.211.55.8 -p
```
