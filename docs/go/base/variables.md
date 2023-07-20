---
title: Go 变量定义
---

## 常用

```go
var a int // 声明一个变量，初始化是默认值

var a int=100 // 声明变量，并初始化值

var a =100 // 声明变量，并初始化值,类型推断。

a:= 100 // 在函数中使用，不能全局定义。
fmt.Println(a1)
a1 = 200
fmt.Println(a1)

var a2, a3 int
fmt.Println(a2, a3)

var a4, a5 = 11, "100"
fmt.Println(a4, a5)

var (
  aa         = 10
  aa1 int    = 10
  aa2 string = "10"
  aa3        = "10"
)
```



### 常量

```shell
const name = 1 // 推荐写法
const namea1 int = 1

const name2 int = demo() // 这种写法编译错误
```



### 全局初始变量

const 不能调用函数赋值

```shell
const name = 1
const namea1 int = 1

var name1 int = demo222()

func main() {
	fmt.Println(name, name1, namea1)
}

func demo222() int {
	return 200
}
```

