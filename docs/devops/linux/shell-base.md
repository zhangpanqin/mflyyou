---
title: shell 基础
---

## 前言

还记得当年被 `bat` 支配的恐惧。比起 `shell` 脚本写 `bat` 脚本真的很费劲。

既然你能搞明白 `java` `js` 等这些高级语言，弄明白 `shell` 也是很简单的。学会简单的语法，再看看 `tomcat` 和 `nacos` 等你熟悉的应用中的脚本，学学别人的技巧，差不多就入门了，对于开发来说，足够用了。

主要内容：

-   常用语法
-   运算符
-   特殊变量
-   for,while,case,select 等

[在线运行 shell](https://c.runoob.com/compile/18)，为了效率还是自己整个虚拟机吧。

## 基本语法

### 解析器

编写脚本的时候，可以使用 `vs code` ，安装相应的插件`shell-format`，可以进行语法提示和格式化。

写脚本的时候一定要定义脚本的解析器，不然会出现怪问题。最好给系统内部的解析器一样。

我的系统使用的 `bash` 解析，我写的定义了 `#!/bin/sh` 解析脚本。

我调用 `openssl` 算法来计算路径的 `md5` 怎么都不正确。最后发现是解析器定义的不一样。

```sh
#!/bin/sh
```

```bash
#!/bin/bash
```

`sudo cat /etc/shells` 可以查看系统的解析器。

运行 `echo ${SHELL}` 可以查看系统默认解析器。

我的系统是 `Centos ` 默认 `bash` 解析。

```bash
# 打印出来 /bin/bash
echo ${SHELL}
```

```shell
#!/bin/bash

# eo 用于命令执行失败，停止执行脚本
# x 用于显示命令和对应结果
# u 忽略没有定义的变量can
set -euxo pipefail
```

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

| 变量 | 描述                                                                        | 例子 |
| ---- | --------------------------------------------------------------------------- | ---- |
| $0   | 当前脚本名称                                                                |      |
| $n   | 传给脚本的参数，\$1 表示第一个参数                                          |      |
| \$\$ | 当前 shell 的进程 id                                                        |      |
| \$?  | 上个命令的退出状态或函数返回值，0 表示正常，其余值异常。建议大于 0 表示异常 |      |
| \$#  | 传给脚本或函数的参数个数                                                    |      |

`error.log` 中的内容如下。

```bash
#!/bin/bash

echo "当前脚本名称 \$0: $0"

echo "传递给脚本的第一个参数 \$1： $1"

echo "当前 shell 的 pid \$\$： $$"

echo "上个命令执行的返回值 \$?：$?"

echo "传递给脚本的个数 \$#：$#"

# 睡眠 6 秒
sleep 6
```

```txt
[parallels@centos-7 ~]$ sh error.log canshu1
当前脚本名称 $0: error.log
传递给脚本的第一个参数 $1： canshu1
当前 shell 的 pid $$： 14952
上个命令执行的返回值 $?：0
传递给脚本的个数 $#：1
[parallels@centos-7 ~]$
```

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

## 定义函数

| 变量 | 描述                                                                        | 例子 |
| ---- | --------------------------------------------------------------------------- | ---- |
| $0   | 当前脚本名称                                                                |      |
| $n   | 传给脚本的参数，\$1 表示第一个参数                                          |      |
| \$\$ | 当前 shell 的进程 id                                                        |      |
| \$?  | 上个命令的退出状态或函数返回值，0 表示正常，其余值异常。建议大于 0 表示异常 |      |
| \$#  | 传给脚本或函数的参数个数                                                    |      |

```bash
f2() {
    # 声明局部变量
    local loc_val=23
    echo "传给函数的第一个值为: $1"
    return "22"
}
f2 aaa
# 将上个命令 f2 aaa 的返回结果拿到赋值给 code
code=$(($?))
echo "执行 f2 的返回值为 ${code}"
```

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

## 启动和关闭 java 服务脚本

### 启动

> 参考了 `nacos` 的脚本目录和编写。

```bash
#!/bin/sh

# 设置 springboot 启动的 jar 包
JAR_NAME="proximab-server"


# 设置 jvm 配置信息
JAVA_OPT="-server -Xms1g -Xmx1g -Xmn512m -XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=512m"

# 设置 gc 日志相关
JAVA_OPT="${JAVA_OPT} -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=${BASE_DIR}/logs/java_heapdump.hprof"

#
# 只需要考虑修改以上参数就行
#

# 判断是否配置 JAVA_HOME
if [ -z "${JAVA_HOME}" ]; then
    echo "please set JAVA_HOME";
    exit 1;
fi

# 设置执行的 java 路径
export JAVA="${JAVA_HOME}/bin/java"

# 设置项目的根路径
export BASE_DIR=`cd $(dirname $0)/..; pwd`

# 设置配置文件位置,并且自定义自己的配置文件位置
DEFAULT_SEARCH_LOCATIONS="classpath:/,classpath:/config/,file:./,file:./config/"
CUSTOM_SEARCH_LOCATIONS=${DEFAULT_SEARCH_LOCATIONS},file:${BASE_DIR}/conf/

# 设置启动的配置文件
JAVA_OPT="-jar ${JAVA_OPT} ${BASE_DIR}/lib/${JAR_NAME}.jar --spring.config.location=${CUSTOM_SEARCH_LOCATIONS}"
JAVA_OPT="${JAVA_OPT} --logging.config=${BASE_DIR}/conf/logback-spring.xml"
# 配置日志文件生成的位置
JAVA_OPT="${JAVA_OPT} --logging.log-path=${BASE_DIR}/logs"


# 项目日志位置
if [ ! -d "${BASE_DIR}/logs" ]; then
  mkdir ${BASE_DIR}/logs
fi

# 启动时输出启动的日志
if [ ! -f "${BASE_DIR}/logs/start.out" ]; then
  touch "${BASE_DIR}/logs/start.out"
fi

# 将启动的 java 相关的配置信息打印到日志文件中
echo "${JAVA} ${JAVA_OPT} ${BASE_DIR}/lib/${JAR_NAME}" > ${BASE_DIR}/logs/start.out 2>&1 &

# 将错误日志 和 正常输入日志重定向到 start.out 中去
nohup ${JAVA} ${JAVA_OPT} >> ${BASE_DIR}/logs/start.out 2>&1 &

echo "${JAR_NAME} is starting，you can check the ${BASE_DIR}/logs/start.out"
```

### 关闭

```bash
#!/bin/sh
# 设置 jar 名称
JAR_NAME="proximab-server"


#
# 只需要考虑修改以上参数就行
#


# 设置项目的根路径
export BASE_DIR=`cd $(dirname $0)/..; pwd`

PID=`ps -ef | grep -i "${JAR_NAME}.jar" | grep java | grep -v grep | awk '{print $2}'`

if [ -z "$PID" ] ; then
        echo "No ${JAR_NAME} running."
        exit 1;
fi

echo "The ${JAR_NAME} is running ,PID is (${PID}) ..."

kill ${PID}

if [ $? != 0 ]; then
    echo "kill ${JAR_NAME} fail"
    exit 1;
fi
echo "kill ${JAR_NAME} is OK, PID (${PID} shutdown )"
```
