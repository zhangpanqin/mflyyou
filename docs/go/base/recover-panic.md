---
title: panic 和 recover 处理运行时异常
---

## panic

`panic` 是一个内建函数，用于引发程序的运行时错误（runtime error）或异常（exception）。

`panic` 能够改变程序的控制流，调用 `panic` 后会立刻停止执行当前函数的剩余代码，并在当前 Goroutine 中递归执行调用方的 `defer`。

当出现无法恢复的错误或不符合预期的情况时，你可以使用 `panic` 函数来中止当前的程序执行流程。



-   假如函数 F 有 panic 语句执行，会终止 panic 语句之后要执行的代码
-   在 panic 所在函数 F 内如果存在要执行的 defer 函数列表，按照 defer 的先进后出
-   返回函数 F 的调用者 G，在 G 中，调用函数 F 语句之后的代码不会执行，假如函数 G 中存在要执行的 defer 函数列表，按照 defer 的逆序执行

```go
func G(i int) {
	defer func() {
		fmt.Println("G2 panic 2")
	}()
	defer func() {
		fmt.Println("G2 panic 1")
	}()
	F(i)
}
func F(i int) {
	defer func() {
		// panic 执行之后，这个代码会被调用
		fmt.Println("panic 执行之后可以执行2")
	}()
	defer func() {
		// panic 执行之后，这个代码会被调用
		fmt.Println("panic 执行之后可以执行1")
	}()
	if i == 1 {
		panic("Something went wrong!")
	}
	fmt.Println("test 没有发生错误") // 当 panic执行之后，这行代码不会执行
}

panic 执行之后可以执行1
panic 执行之后可以执行2
G2 panic 1
G2 panic 2
panic: Something went wrong!
Process finished with the exit code 2
```

## recover

在 Go 编程语言中，`recover` 是一个内建函数，`recover` 函数用于捕获并处理 `panic` 引发的错误。

它是一个只能在 `defer` 中发挥作用的函数，在其他作用域中调用不会发挥作用；

处理之后，程序会正常运行。

```go
package main

import "fmt"

func main() {
	G(1)
	fmt.Println("在 main 方法执行 test 方法之后，打印")
}

func G(i int) {
	defer func() {
		if err := recover(); err != nil {
			fmt.Println("发生了 panic：", err)
		}
	}()
	F(i)
}

func F(i int) {
	defer func() {
		// panic 执行之后，这个代码会被调用
		fmt.Println("panic 执行之后可以执行2")
	}()
	defer func() {
		// panic 执行之后，这个代码会被调用
		fmt.Println("panic 执行之后可以执行1")
	}()
	if i == 1 {
		panic("Something went wrong!")
	}
	fmt.Println("test 没有发生错误") // 当 panic执行之后，这行代码不会执行
}

panic 执行之后可以执行1
panic 执行之后可以执行2
发生了 panic： Something went wrong!
在 main 方法执行 test 方法之后，打印

Process finished with the exit code 0

```



## 总结

`panic` 关键字在 Go 语言的源代码是由数据结构 `runtime._panic` 表示的。每当我们调用 `panic` 都会创建一个如下所示的数据结构存储相关信息：

1. `argp` 是指向 `defer` 调用时参数的指针；
2. `arg` 是调用 `panic` 时传入的参数；
3. `link` 指向了更早调用的 [`runtime._panic`](https://draveness.me/golang/tree/runtime._panic) 结构；
4. `recovered` 表示当前 [`runtime._panic`](https://draveness.me/golang/tree/runtime._panic) 是否被 `recover` 恢复；
5. `aborted` 表示当前的 `panic` 是否被强行终止；

```go
type _panic struct {
	argp      unsafe.Pointer
	arg       interface{}
	link      *_panic
	recovered bool
	aborted   bool
	pc        uintptr
	sp        unsafe.Pointer
	goexit    bool
}
```

程序崩溃和恢复的过程：

1. 编译器会负责做转换关键字的工作；

   1. 将 `panic` 和 `recover` 分别转换成 `runtime.gopanic` 和 `runtime.gorecover`
   2. 将 `defer` 转换成 `runtime.deferproc` 函数
   3. 在调用 `defer` 的函数末尾调用 `runtime.deferreturn`

2. 在运行过程中遇到 `runtime.gopanic `方法时，会从 Goroutine 的链表依次取出 `runtime._defer` 结构体并执行；

3. 如果调用延迟执行函数时遇到了 `runtime.gorecover` 就会将  `_panic.recovered` 标记成 true 并返回 `panic` 的参数；

4. 如果没有遇到 `runtime.gorecover` 就会依次遍历所有的 `runtime._defer` ，并在最后调用 `runtime.fatalpanic` 中止程序、打印 `panic` 的参数并返回错误码 2；

