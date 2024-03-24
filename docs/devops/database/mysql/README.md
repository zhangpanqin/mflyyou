# Mysql 基础

## docker 启动 Mysql

```shell
docker volume inspect mysql_data
docker run -d \
    --name local_mysql \
    -p 3306:3306 \
    -v mysql_data:/var/lib/mysql \
    -e MYSQL_ROOT_PASSWORD=123456 \
    -e MYSQL_PASSWORD=123456 \
    -e MYSQL_USER=xiaozhang \
    -e MYSQL_DATABASE=sandbox \
    mysql:8.0.36-bullseye
```



