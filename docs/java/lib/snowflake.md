# 雪花算法

雪花算法（SnowFlake）是 Twitter 开源分布式 id 的算法。一个 Snowflake ID 有 64 比特位，每个部分代表不同的含义，Java long 就是 64 位（1 字节，8 位，long 是 8 个字节）。

 

```
|-- 1 bit not use --|-- 41 bits timestamp in milliseconds --|-- 10 bits worker id --|-- 12 bits sequence --|
```

- 第一部分：1 比特位，始终是 0，不使用。
- 第二部分：41 比特位，表示时间戳，毫秒值，可使用 69 年；这个值一般是当前毫秒值-减去一个固定数，意味着我们，从当下算的 69 年
- worker id：10 比特位，如果你是在一个集群，可以根据 ip 地址来转换 worker id。
- sequence：12 比特位，自增序列，二进制 12 位都是 1，是 4095, 代表一个机器，一毫秒，可以生成 4095 的 id 数量。

### SnowFlake算法的缺点

- SnowFlake 依赖于系统时钟的一致性。如果某台机器的系统时钟回拨，有可能造成ID冲突。