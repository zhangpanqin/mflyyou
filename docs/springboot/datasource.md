---
title: 数据库连接池配置
---

# 数据库连接池配置

[HikariCP: 光 HikariCP](https://github.com/brettwooldridge/HikariCP)

curl -v https://www.baidu.com

### postgresql tcp_keepalives 配置说明

[PostgreSQL: Documentation: 15: 20.3. Connections and Authentication](https://www.postgresql.org/docs/current/runtime-config-connection.html#RUNTIME-CONFIG-CONNECTION-SETTINGS)

### linux 默认 tcp 配置

[Using TCP keepalive under Linux](https://tldp.org/HOWTO/TCP-Keepalive-HOWTO/usingkeepalive.html)

### istio tcp_keepalives 配置说明

[Istio / Destination Rule](https://istio.io/latest/docs/reference/config/networking/destination-rule/#ConnectionPoolSettings-TCPSettings-TcpKeepalive)

### 抓包

```shell
sudo tcpdump -i lo0 dst port 54322 or src port 54322
```

### Tcp 测试

[cyberelf/netcat-keepalive: Classic netcat with tcp keepalive switches.](https://github.com/cyberelf/netcat-keepalive)

[Implementing long-running TCP Connections within VPC networking | Networking & Content Delivery](https://aws.amazon.com/blogs/networking-and-content-delivery/implementing-long-running-tcp-connections-within-vpc-networking/)

```shell
  cat /proc/sys/net/ipv4/tcp_keepalive_time
  7200

  cat /proc/sys/net/ipv4/tcp_keepalive_intvl
  75

  cat /proc/sys/net/ipv4/tcp_keepalive_probes
  9
```

```shell
  echo 30 > /proc/sys/net/ipv4/tcp_keepalive_time

  echo 5 > /proc/sys/net/ipv4/tcp_keepalive_intvl

  echo 2 > /proc/sys/net/ipv4/tcp_keepalive_probes
```

```shell
 sysctl \
  net.ipv4.tcp_keepalive_time \
  net.ipv4.tcp_keepalive_intvl \
  net.ipv4.tcp_keepalive_probes
```

```shell
 sysctl -w \
  net.ipv4.tcp_keepalive_time=30 \
  net.ipv4.tcp_keepalive_intvl=5 \
  net.ipv4.tcp_keepalive_probes=2
```

```sql
ALTER SYSTEM SET tcp_keepalives_idle=30;
ALTER SYSTEM SET tcp_keepalives_interval=5;
ALTER SYSTEM SET tcp_keepalives_count=2;

show tcp_keepalives_idle;
show tcp_keepalives_interval;
show tcp_keepalives_count;
```

```shell
jdbc:postgresql://postgres:123456@localhost:5432/di_application
```

```shell
curl https://reqbin.com/echo \
   -H "Connection: keep-alive" \
   -H "Keep-Alive: timeout=5, max=100"
```
