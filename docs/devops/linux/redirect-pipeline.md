---
title: 重定向和管道流
---

## stdin，stdout 及 stderr

在 Linux 下，当一个用户进程被创建的时候，系统会自动为该进程创建三个数据流，标准输入（stdin），标准输出（stdout）和 标准错误输出（stderr）。

| Type   | File descriptor (fd) | 描述                                  |
| ------ | -------------------- | ------------------------------------- |
| stdin  | 0                    | 通常，`标准输入` 来自我们的键盘。     |
| stdout | 1                    | 通常，`标准输出` 就是我们的终端。     |
| stderr | 2                    | 通常，`标准错误输出` 就是我们的终端。 |



## 重定向

我们可以将标准输入，标准输出和标准错误输出  `重定向`  某个地方。

- `>` 改变输出
  - `1>` 标准输出重定向
  - `2>` 标准错误输出重定向
- `<` 改变输入

```shell
# 重定向输出流量到 a.txt
echo "111" > a.txt

# 同时改变输入输出
cat < aa.html > aa_new.html 

# 渲染模板到目标文件
envsubst < environments/nonprod.auto.tfvars.json.tpl > nonprod.auto.tfvars.json

# 将标准输出冲顶点
echo "111" > /dev/null

# 将标准输出和错误输出重定向到文件
ls a.txt bb.txt >> error.log 2>&1
```



## 管道流

多个命令通过 `|` 链接，前一个命令的输出，是后一个命令的输入。

```bash
cat error.log  | grep "a.txt"
```



