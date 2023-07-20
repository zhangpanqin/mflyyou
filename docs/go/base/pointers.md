---
title: Go 指针
---

## Go 指针介绍

`指针` (pointer) 持有一个值的内存地址。对指针操作修改值，会影响所有引用的值。

`*T` 定义指针变量。

```go
var p *int
```

`&` 会生成一个指针类型的变量，它的值就是内存地址。

```go
i := 42
p = &i
```

`*` 指针变量，取指针存的值。

```go
fmt.Println(*p) // 42
*p = 21         // set i through the pointer p
```



```go
func main() {
	i := 42
	var p *int
	p = &i

	fmt.Println(*p) // 42
	fmt.Println(p)  // 0xc00011c018
	fmt.Println(i)  // 42

	*p = 21 // 修改指针就相当于修改 i

	fmt.Println(*p) // 21
	fmt.Println(p)  // 0xc00011c018
	fmt.Println(i)  // 21

	// 修改 i，同样影响指针
	i = 404
	fmt.Println(*p) // 404
	fmt.Println(p)  // 0xc00011c018
	fmt.Println(i)  // 404
}
```



:::tip

Go语言中的函数传参都是值拷贝，当我们想要修改某个变量的时候，我们可以创建一个指向该变量地址的指针变量。传递数据使用指针，而无须拷贝数据。

:::

demoa2 是不会修改变量 `i` 。

```go
type Demo struct {
	Name string
}

func main() {
	var i = Demo{
		Name: "qian",
	}
	demoa1(&i)
	fmt.Println(i)
	demoa2(i)
	fmt.Println(i)
}

func demoa1(d *Demo) {
	d.Name = "demoa1"
}
func demoa2(d Demo) {
	d.Name = "demoa2"
}
```



### Slice 的意外？



当不传 slice 的指针时候，是没办法对 i append 的。但可以修改 i 里面存在的 item

```go
func main() {
	var i = []string{""}
	fmt.Println(i) // []
	Sum223(i)
	fmt.Println(i) // []
	Sum22(&i)
	fmt.Println(i) // [ Sum22 传的指针]
}

// 一样可以修改 arr 内容
func Sum223(arr []string) {
	arr = append(arr, "Sum22 传的指针")
}

func Sum22(arr *[]string) {
	*arr = append(*arr, "Sum22 传的指针")
}
```





```go
func main() {
	var i = []string{"1", "2"}
	fmt.Println(i) // [1 2]
	demo1(i)
	fmt.Println(i) // [demo1 2]
	demo2(&i)
	fmt.Println(i) // [demo1 demo2]
}

// 一样可以修改 arr 内容
func demo1(arr []string) {
	arr[0] = "demo1"
}

func demo2(arr *[]string) {
	a := *arr
	a[0] = "demo2"
}
```



## 总结

```go
var p *int // 定义指针变量
i := 42
p = &i 		// & 对变量取内存地址
*p = 21		// 修改指针变量的值，也会影响 i 的值。
```



所以只要遵循一条原则就不会错。

只要是想修改原来的参数，就传指针变量。