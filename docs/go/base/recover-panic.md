---
title: panic 和 recover 处理运行时异常
---

## panic

`panic` 是一个内建函数，用于引发程序的运行时错误（runtime error）或异常（exception）。当出现无法恢复的错误或不符合预期的情况时，你可以使用 `panic` 函数来中止当前的程序执行流程。

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

在 Go 编程语言中，`recover` 是一个内建函数，`recover` 函数用于捕获并处理 `panic` 引发的错误。它应该在 `defer` 语句中使用，以便在发生 `panic` 时被调用。

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
