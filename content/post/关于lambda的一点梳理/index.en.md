---
title: 'Notes on Lambda'
slug: '关于lambda的一点梳理'
date: 2015-04-29T11:57:00+00:00
draft: false
categories: ['c++', 'leetcode', 'scala']
tags: ['array', 'c++11', 'lambda']
---

Of all the new features in C++11, the ones I've been bumping into the most lately are threads and lambda expressions. This post is mostly about lambda usage — partly to summarize it, partly to nail it down for myself (references at the bottom; credit to the original author).

A basic lambda expression looks like this. It computes the square of an integer and returns it, and the expression can be invoked immediately — pretty convenient, right? No need to split the class and the function definition apart.

``` c
    int result = [](int input){ return input * input; }(10);
    std::cout << result << std::endl;
```

If you want to reuse the snippet, store the function in a local variable:

``` c
    auto func = [](int input){ return input * input; };
    std::cout << func(10) << std::endl;
    std::cout << func(20) << std::endl;
```

OK, so now what if we want a lambda that can square a floating-point number too? Or a complex number? Something like this:

``` c
    // int 的平方
    std::cout << func(10) << std::endl;
    // double的平方
    std::cout << func(3.1415) << std::endl;
    // 复数的平方
    std::cout << func(std::complex<double>(3, -2)) << std::endl;
```

How do we make this code reusable? Function templates, of course:

``` c
    template <typename T>
    T func(T param) {
         return param * param;
    }
```

But function templates aren't really the point of the article I was reading — the snippet above is what's called a *named global function*. The newer C++14 standard introduces the concept of a *generalized lambda*: we're allowed to use `auto` as the parameter type of a lambda (it seems C++ is doubling down on type inference — `auto` keeps showing up in more places). With that, we can express the same thing more concisely and elegantly:

``` c
auto func = [](auto input){ return input * input;  };
```

Full example:

``` c
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

Lambdas really shine when combined with the STL. Say you want to sort a vector in descending order — with a generic lambda you can write:

``` c
  std::sort(V.begin(), V.end(), [](auto i, auto j) { return (i > j); });
```

Full example — sorting a vector of 10 integers in descending order, using STL plus a generic lambda:

``` c
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

One thing the original author skipped entirely: the `[]` at the front of a lambda. That's the *capture list*. It lets the lambda body see variables from the surrounding scope. More formally, the capture list specifies which external variables, from the enclosing visible scope, are accessible inside the lambda body. The forms are:

1.  `[a, &b]` — capture `a` by value, `b` by reference (similar to ordinary parameter passing).
2.  `[this]` — capture the `this` pointer by value.
3.  `[&]` — capture all external automatic variables by reference.
4.  `[=]` — capture all external automatic variables by value.
5.  `[]` — capture nothing. All the snippets above use this form.

When a reader asked the original author why they didn't cover `[]`, the answer was that using a capture list tends to make code worse — so they didn't encourage it.

### References

[https://solarianprogrammer.com/2014/08/28/cpp-14-lambda-tutorial/](https://solarianprogrammer.com/2014/08/28/cpp-14-lambda-tutorial/)
