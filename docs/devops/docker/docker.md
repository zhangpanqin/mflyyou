### colima
可以在本地运行 docker 命令
```shell
colima start
colima stop
```

### 创建数据库

```shell
docker pull postgres:14.3-alpine

docker volume create fly-postgres-data

docker run --name fly-postgres \
-e POSTGRES_USER=postgres \
-e POSTGRES_PASSWORD=123456 \
-e POSTGRES_DB=sample \
-p 5432:5432 \
-v fly-postgres-data:/var/lib/postgresql/data \
-d postgres:14.3-alpine

docker start di-postgres

docker stop di-postgres

docker rm di-postgres

docker volume rm fly-postgres-data

docker ps -a

psql -h localhost -U postgres -d postgres
```



### docker-compose