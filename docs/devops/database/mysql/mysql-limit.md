# Mysql Limit 限制

MySQL使用 limit 分页,  m是偏移量，n是要查询的数量。

当偏移量m过大的时候，查询效率会很低。因为MySQL是先查出m+n个数据，然后抛弃掉前m个数据。

```sql
limit m,n
```

m+n 次回表操作，优化成 n 次回表操作。



### 优化示例


```shell
SELECT * FROM t ORDER BY key1 LIMIT 1;
SELECT * FROM t ORDER BY key1 LIMIT 5000, 1;
```

`key1` 加了索引，在 `Limit 5000,1` 的时候可能不会使用索引而全表扫描差。

MySQL内部其实是分为 server 层和存储引擎层的：

limit 的处理事放在了 server 层处理，当存储引擎把数据返回之后，server 层在判断这个数据是不是在 limit 中。

因此实际上是查询了 5001 条数据，然后只把 5001 这一条数据返回给客户端了。

但是这 5000 条数据，从普通索引到回表也发生了 5000 次。

为了减少回表次数，可以通过子查询获得 id，这个 id 只查询索引树就可以得到。这个语句就只发生了一次回表。

```sql
SELECT * FROM t, (SELECT id FROM t ORDER BY key1 LIMIT 5000, 1) AS d
    WHERE t.id = d.id;
```
