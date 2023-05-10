---
title: shell 基础
---

## 基本语法

### 解析器

写脚本的时候一定要定义脚本的解析器，不然会出现怪问题。最好给系统内部的解析器一样。

我的系统使用的 `bash` 解析，我写的定义了 `#!/bin/sh` 解析脚本。

::: tip

我调用 `openssl` 算法来计算路径的 `md5` 怎么都不正确。最后发现是解析器定义的不一样。

:::

运行 `echo ${SHELL}` 可以查看系统默认解析器。

我的系统是 `Centos ` 默认 `bash` 解析。

```bash
# 打印出来 /bin/bash
echo ${SHELL}
```

```shell
#!/bin/bash
# set -u 遇到不存在的变量就会报错，
# set -e 脚本只要发生错误，就终止执行，管道命令错误解决不了
# set -o pipefail 只要一个子命令失败，整个管道命令就失败，脚本就会终止执行。
set -eo pipefail
```

```shell
cat >test_set_e_shell.sh <<EOF
#!/bin/bash
set -e

foo | echo a
echo bar
EOF
```



```shell
bash test_set_e_shell.sh
a
test_set_e_shell.sh: line 4: foo: command not found
bar
```

可以看到管道命令 `echo a` 执行了。脚本执行成功，以零退出。

```shell
cat >test_set_eo_pipefail_shell.sh <<EOF
#!/bin/bash
set -eo pipefail

foo | echo a
echo bar
EOF
```



```shell
test_set_eo_pipefail_shell.sh: line 4: foo: command not found
a
```

脚本执行失败，以非零退出。



### 注释

使用 `# ` 来注释一行内容。



### `echo`

`echo` 常用做打印一段话到显示器。我们可以通过重定向，将内容保存到文件中去。

```bash
MY_CONTENT="12124" \
echo "${MY_CONTENT}打印内容到文件" > a.txt
```

当我们在控制台输入多行命令的时候，可以使用 `\` 来链接命令。

变量的引用使用 `$MY_CONTENT` 和 `${MY_CONTENT}` 是相同的。我习惯与用后者，安全，避免 `$MY_CONTENTaaa` 这样的错误，我写成`${MY_CONTENT}aaa` 就不会有问题。

### 单引号与双引号区别

```bash
MY_CONTENT="12124" \
echo "打印内容为：${MY_CONTENT}"

# 打印内容为：12124
```

```bash
MY_CONTENT="12124" \
echo '打印内容为：${MY_CONTENT}'

# 打印内容为：${MY_CONTENT}
```

<font color=red>单引号不会进行变量的替换。</font>

### 定义变量

定义变量很简单，直接符合 java 和 js 的变量规则就行了。通常不指定类型的话，定义都是字符串类型的数据，尽管没有单双引号。我习惯用常量的方式定义变量。

```bash
A=111
```

有的时候我们需要变量的引用。定义了变量 `A` ，在 `A` 中引用 `B`。

```bash
#!/bin/bash
BB="张攀钦"
AA="${BB}-mflyyou"
echo "${AA}-456"
```

有的时候还想将命令的运行结果赋值给变量。

比如，我想用 `pwd` 获取当前路径再赋值 `A`。

```bash
#!/bin/bash

# 或者 BASE_DIR=`pwd`
BASE_DIR=$(pwd)
echo "当前路径为：${BASE_DIR}"

```

还有一些变量我们想让其在子进程中访问到。比如我在 `a` 脚本中定义的 `BASE_DIR`，而我在 `a` 中运行 `b` 脚本，`b` 脚本也可以访问到 `BASE_DIR` ；

```bash
export BASE_DIR=`cd $(dirname $0)/..; pwd`
```

### 特殊变量

特殊变量是已经有特殊意义的变量，可以让我们可以获取一些参数。

| 变量 | 描述                                                         |
| ---- | ------------------------------------------------------------ |
| $0   | 脚本文件名称                                                 |
| $n   | 传给脚本的参数，\$1 表示第一个参数                           |
| $#   | 传递给脚本的参数个数                                         |
| $@   | 传递给脚本的所有参数                                         |
| \$\$ | 当前 shell 的进程 id                                         |
| \$?  | 上个命令的退出状态或函数返回值，0 表示正常，其余值异常。建议大于 0 表示异常 |

## 运算符

#### 文件比较运算符

| 操作符 | 描述                                                                  |
| ------ | --------------------------------------------------------------------- |
| -e     | 判断是否文件存在，存在返回 true。                                     |
| -f     | 判断文件是否是一个普通文件，文件不存在返回 false。文件存在返回 true。 |
| -d     | 判断路径是否是一个目录，不存在返回 false。是目录且存在返回 true。     |
| -r     | 文件是否可读 (指运行这个测试命令的用户的读权限)                       |
| -w     | 文件是否可写 (指运行这个测试命令的用户的写权限)                       |
| -x     | 文件是否可执行 (指运行这个测试命令的用户的执行权限)                   |

```bash
# ; 与 then 之间需要有空格
if [ ! -f "${BASE_DIR}/logs/start.out" ]; then
    echo "文件存在"
else
    echo "文件不存在"
fi
```

#### 布尔运算符

假定变量 a 为 10，变量 b 为 20：

| 运算符 | 说明                                                | 举例                                           |
| :----- | :-------------------------------------------------- | :--------------------------------------------- |
| !      | 非运算，表达式为 true 则返回 false，否则返回 true。 | [ ! false ] <br>返回 true。                    |
| -o     | 或运算，有一个表达式为 true 则返回 true。           | [ \$a -lt 20 -o $b -gt 100 ] <br/>返回 true。  |
| -a     | 与运算，两个表达式都为 true 才返回 true。           | [ \$a -lt 20 -a $b -gt 100 ] <br/>返回 false。 |

#### 逻辑运算符

以下介绍 Shell 的逻辑运算符，[[]] 使用。假定变量 a 为 10，变量 b 为 20:

| 运算符 | 说明       | 举例                                             |
| :----- | :--------- | :----------------------------------------------- |
| &&     | 逻辑的 AND | [[\$a -lt 100  && $b -gt 100]] <br/>返回 false   |
| \|\|   | 逻辑的 OR  | [[\$a -lt 100  \|\|  $b -gt 100]] <br/>返回 true |

```bash
#!/bin/bash
a=10
b=20

if [[ $a -lt 100 && $b -gt 100 ]]
then
   echo "返回 true"
else
   echo "返回 false"
fi

if [[ $a -lt 100 || $b -gt 100 ]]
then
   echo "返回 true"
else
   echo "返回 false"
fi
```

```txt
返回 false
返回 true
```

#### 字符串比较运算符

下表列出了常用的 `字符串 ` 运算符，假定变量 a 为 "abc"，变量 b 为 "efg"：

| 运算符 | 说明                                                            | 举例                                                   |
| :----- | :-------------------------------------------------------------- | :----------------------------------------------------- |
| =      | 检测两个字符串是否相等，相等返回 true。                         | [ \${a} = ${b} ] <br/>返回 false。                     |
| !=     | 检测两个字符串是否相等，不相等返回 true。                       | [ \${a} != ${b} ] <br/>返回 true。                     |
| <      | 小于，依照 ASCII 字符排列顺序，注意"<"字符在[ ] 结构里需要转义  | if [[“\${a}" < “\${b}"]] <br>if [ “\${a}" \\< “${b}" ] |
| >      | 大于，依照 ASCII 字符排列顺序，注意">"字符在[ ] 结构里需要转义. | if [[“\${a}" > “​\${b}"]]<br>if [ “​\${a}" \> “${b}" ] |
| -z     | 检测字符串长度是否为 0，为 0 返回 true。                        | [ -z “${a}“ ] <br/>返回 false。                        |
| -n     | 检测字符串长度是否为 0，不为 0 返回 true。                      | [ -n "$a" ] <br/>返回 true。                           |

```bash
#!/bin/bash
a=e1
b=e2
# 比较的时候加上一个字符混合，更安全
if [ "${a}x" == "${b}x" ]; then
   echo "${a} == ${b}: a 等于 b"
else
   echo "${a} == ${b}: a 不等于 b"
fi

if [ "${a}" \> "${b}" ]; then
echo '大于'
else
echo "小于"
fi

if [[ "${a}" > "${b}" ]]; then
echo '大于'
else
echo "小于"
fi
```

#### 数字比较运算符

下面这些比较符只能比较 `数字` 或者 `数字字符串`，比较非数字会报错。

| 比较操作符 | 描述     | 例子                        |
| ---------- | -------- | --------------------------- |
| `-eq`      | 等于     | `if [ 3 -eq "3" ] ` 为 true |
| `-ne`      | 不等于   | `if [ "$a" -ne "$b" ]`      |
| `-gt`      | 大于     | `if [ "$a" -gt "$b" ]`      |
| `-ge`      | 大于等于 | `if [ "$a" -ge "$b" ]`      |
| `-lt`      | 小于     | `if [ "$a" -lt "$b" ]`      |
| `-le`      | 小于等于 | `if [ "$a" -le "$b" ]`      |

#### 算术运算符

\$(()) 可以用于数字运算。

| 运算操作符 | 描述 | 例子            |
| ---------- | ---- | --------------- |
| +          | 加号 | `echo $((2+2))` |
| -          | 减号 |                 |
| /          | 除号 |                 |
| \*         | 乘号 |                 |
| \*\*       | 求幂 |                 |
| %          | 求模 |                 |


## if

```bash
# ; 与 then 之间需要有空格
if [ ! -f "${BASE_DIR}/logs/start.out" ]; then
    echo "文件存在"
else
    echo "文件不存在"
fi
```

## for

语法比较简单没有什么可说的。

```bash
strs="Mercury Venus Earth Mars Jupiter Saturn Uranus Neptune Pluto"
for planet in ${strs}; do
    echo ${planet} # 每个行星被单独打印在一行上.
done
```

## while

语法比较简单没有什么可说的。

```bash
#!/bin/bash
count=1
while [ ${count} -le 5 ];
do
	echo "Loop # ${count}"
	# count 自增
	count=$(( ${count} + 1 ))
	# ((count++))
done
```

## case

类似 `java` 中的 switch 语法。

```bash
#!/bin/bash
fn() {
    case "$1" in
    # 匹配 a 或 c
    "a" | "c")
        echo "输入参数为 $1 "
        ;;

    "b")
        echo "输入参数2为 2 "
        ;;

        # 匹配其它
    *)
        echo "输入其他"
        ;;
    esac
}
fn a1
```

## select

`select` 还是比较有用的，有的时候我们需要用户选择需要执行的命令，

```bash
#!/bin/bash
Operations=("start" "stop" "restart")
# 输入提示
PS3="Please input the number of operation :"
select operation in ${Operations[@]}; do
    case ${operation} in
    "start")
        echo "执行 start 操作。"
        break
        ;;
    "stop")
        echo "执行 stop 操作。"
        break
        ;;
    "restart")
        echo "执行 restart 操作。"
        break
        ;;
    *)
        echo "输入错误，请重新输入..."
        ;;
    esac
done
```

运行上述脚本的之后，然后你输入 `1` ,会执行 `start` 操作。很方便，不需要用户输入参数了。

```txt
1) start
2) stop
3) restart
Please input the number of operation :
```
