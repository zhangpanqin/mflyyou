---
title: Go 函数
---

## 参数传递

Go 语言在传递参数时是传值还是传引用也是一个有趣的问题，不同的选择会影响我们在函数中修改入参时是否会影响调用方看到的数据。我们先来介绍一下传值和传引用两者的区别：

- 传值：函数调用时会对参数进行拷贝，被调用方和调用方两者持有不相关的两份数据；
- 传引用：函数调用时会传递参数的指针，被调用方和调用方两者持有相同的数据，任意一方做出的修改都会影响另一方。

不同语言会选择不同的方式传递参数，Go 语言选择了传值的方式，**无论是传递基本类型、结构体还是指针，都会对传递的参数进行拷贝**。本节剩下的内容将会验证这个结论的正确性。

**Go 语言的整型和数组类型都是值传递的**，也就是在调用函数时会对内容进行拷贝。需要注意的是如果当前数组的大小非常的大，这种传值的方式会对性能造成比较大的影响。



### 参数返回

可以定义返回参数的变量，然后给这个变量赋值

```go

func main() {
	fmt.Println(var3Demo333(1))
	fmt.Println(var3Demo333(2))
}

func var3Demo333(i int) (r int) {
	r = 20
	if i == 1 {
		return
	}
	return 200
}
```



### 封装

避免值 copy，`func (man *Man) Eat()`

```go
type Man struct {
	Name string
}

func (man *Man) Eat() {
	fmt.Printf("%s Eat \n", man.Name)
}

func (man *Man) Walk() {
	fmt.Printf("%s Walk \n", man.Name)
}

type SuperMan struct {
	Man
}

func (man *SuperMan) Eat() {
	fmt.Printf("SuperMan %s Eat \n", man.Name)
}

func main() {
	aa1 := SuperMan{}
	aa2 := SuperMan{
		Man{
			Name: "小明",
		},
	}
	aa1.Eat()
	aa2.Eat()
}
```

