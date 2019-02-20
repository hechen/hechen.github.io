---
title: "关于Lambda的一点梳理"
date: 2015-04-29 11:57:00
categories: ["C++"]
tags: ["C++11","Lambda"]
---

关于C++11的新特性，最近接触比较多的就是关于thread的部分，还有就是Lambda表达式，今天主要针对Lambda的用法进行一定的阐述和汇总（参考链接在文章下方，向大师致敬！），同时给自己梳理下知识点，加深印象。 

<!-- more -->

基本的Lambda表达式如下所示，该表达式计算一个整型数据的平方值并返回，并且该表达式能够直接使用，是不是特别方便？不再需要将类本身和函数定义分割开来。

``` C++
    int result = [](int input){ return input * input; }(10);
    std::cout << result << std::endl;
```

如果你需要重用该段代码片段，可以将该函数保存为本地变量，如下所示：

``` C++
    auto func = [](int input){ return input * input; };
    std::cout << func(10) << std::endl;
    std::cout << func(20) << std::endl;
```

好了，现在我们需要写一个能够计算浮点类型的Lambda表达式怎么办？ 或者我们需要能够计算复数（complex number）怎么办？ 我们需要的就像下面这样：

``` C++
    // int 的平方
    std::cout << func(10) << std::endl;
    // double的平方
    std::cout << func(3.1415) << std::endl;
    // 复数的平方
    std::cout << func(std::complex<double>(3, -2)) << std::endl;
```

如何让代码复用起来？ 当然是 函数模板（function template）了。 如下：


``` C++
    template <typename T>
    T func(T param) {
         return param * param;
    }
```
但是函数模板并不是那篇文章所追求的，以上的这段代码被称作是 a named global function. 而在最新的通过的C++14标准中引入了 generalized lambda的概念。我们允许lambda表达式的传参类型为auto类型（看来C++是要强化类型自动推导啊，auto关键字能够使用的地方越来越多了。），如下我们能够使用更短，更优雅的代码实现以上需求。

    
``` C++
auto func = [](auto input){ return input * input;  };
```

完整代码如下：

``` C++
     #include<iostream>
     #include<complex>
     int main() {
        // Store a generalized lambda, that squares a number, in a variable
        auto func = [](auto input) { return input * input; };
  
        // Usage examples:
        // square of an int
        std::cout << func(10) << std::endl;
 
        // square of a double
        std::cout << func(2.345) << std::endl;
 
        // square of a complex number
        std::cout << func(std::complex<double>(3, -2)) << std::endl;
 
        return 0;
     }
```
其实lambda表达式和STL在一起使用能够发挥很大的作用，假设你要排序一个vector让其降序，使用generic lambda，我们可以这样写：

  
``` C++
  std::sort(V.begin(), V.end(), [](auto i, auto j) { return (i > j); });
```

完整的代码如下，对一个包含10个整型数据的vector进行排序，使之降序。结合STL和Generic Lambda：

``` C++
     #include<iostream>
     #include<vector>
     #include<numeric>
     #include<algorithm>
	    
	 int main() {
        std::vector<int> V(10);
      
        // Use std::iota to create a sequence of integers 0, 1, ...
        std::iota(V.begin(), V.end(), 1);
     
        // Print the unsorted data using std::for_each and a lambda
        std::cout << "Original data" << std::endl;
        std::for_each(V.begin(), V.end(), [](auto i) { std::cout << i << " "; });
        std::cout << std::endl;
 
        // Sort the data using std::sort and a lambda
        std::sort(V.begin(), V.end(), [](auto i, auto j) { return (i > j); });
     
        // Print the sorted data using std::for_each and a lambda
        std::cout << "Sorted data" << std::endl;
        std::for_each(V.begin(), V.end(), [](auto i) { std::cout << i << " "; });
        std::cout << std::endl;
 
        return 0；
    }
```

其中关于lambda表达式前面的[], 作者只字未提，[]是捕获列表（capture list），我们可以将lambda表达式外围定义的变量捕获使得我们能够在lambda表达式内部使用。不通俗的说capture list指定了在可见域范围内lambda表达式的代码内可见的外部变量的列表，具体有以下几点：
1. [a, &b] a变量传值捕获，b引用捕获，这和普通函数传参相类似；
2. [this] 以值的方式捕获this指针
3. [&]以引用的方式捕获外部自动变量
4. [=] 以值的方式捕获外部自动变量
5. [] 不捕获任何外部变量， 以上所有代码均属于此种。

参考文章中作者在回答读者提出的为什么不讲解[]的原因是回答到：使用捕获列表会使你的代码变得bad~,因此他不鼓励。



### 参考：
[https://solarianprogrammer.com/2014/08/28/cpp-14-lambda-tutorial/](https://solarianprogrammer.com/2014/08/28/cpp-14-lambda-tutorial/)

