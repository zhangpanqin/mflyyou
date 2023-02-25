```shell
docker pull mysql:5.7.38
docker run --name fly-mysql -e MYSQL_ROOT_PASSWORD=123456 -e MYSQL_DATABASE=fly-mysql -p 3306:3306 -d mysql:5.7.38
docker container stop fly-mysql &&  docker container rm fly-mysql
mysql -h127.0.0.1 -uroot -p123456 -Dfly-mysql
```





```sql
CREATE TABLE person (
  id bigint NOT NULL AUTO_INCREMENT,
  username varchar(10) NOT NULL,
  username2 varchar(10) NOT NULL,
  username3 bigint NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_username (username(10)) USING BTREE,
  UNIQUE KEY uk_username2 (username2(8)) USING BTREE,
  UNIQUE KEY uk_username3 (username3) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `person` (`id`, `username`, `username2`, `username3`) VALUES
(1, '123456789a', '123456789a', 1),
(2, '123456789b', '123456779b', 2);

explain delete from person where id =1;
```

