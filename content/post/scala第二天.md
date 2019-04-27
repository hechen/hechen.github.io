---
title: "scala Day2"
date: 2015-04-16 18:43:00
categories: ["scala"]
---

因为这几天在学习Coursera公开课[Principles of Reactive Programming](https://class.coursera.org/reactive-002) ，因为之前木有木有注意到需要对至少一门函数式编程语言solid foundation，因此只能临时抱佛脚，恰好手头有一本七周七语言这本书一直木有看，借着这个课程的督促把这本书翻看下，当然内容仅包括Scala这一章，今天看到第二天的内容，重头戏是Collection。这篇blog主要记录关于这次自习题的解答。

<!-- more -->


## 找
### 关于如何使用Scala文件的讨论
既然Scala可以使用Java中任意的对象（Objects），因此可以使用Java中针对文件的操作，例如java.io.File就是其中之一，示例如下：

``` scala
import java.io._

object Test {
    def main(args: Array[String]) {
        val writer = new PrintWriter(new File("test.txt"))
        writer.write("Hello Scala")
        writer.close()
    }
}
```

从本地读取文件，scala库自带文件读取，如下所示代码为一段示例，可以读取本地文件中得内容
读取文件内容：

``` scala
import scala.io.Source

object Test {
   def main(args: Array[String]) {
      println("Following is the content read:" )

      Source.fromFile("test.txt" ).foreach{ 
         print 
      }
   }
}
```

### 闭包(closure)和代码块有何不同
关于闭包的概念，只能从网路上查找资料加上自己理解写

#### 闭包（closure）

> 闭包是可以包含自由（未绑定到特定对象）变量的代码块；这些变量不是在这个代码块内或者任何全局上下文中定义的，而是在定义代码块的环境中定义（局部变量）。“闭包” 一词来源于以下两者的结合：要执行的代码块（由于自由变量被包含在代码块中，这些自由变量以及它们引用的对象没有被释放）和为自由变量提供绑定的计算环境（作用域）。在 Scala、Scheme、Common Lisp、Smalltalk、Groovy、JavaScript、Ruby、 Python、Go、Lua、objective c 以及Java（Java8及以上）等语言中都能找到对闭包不同程度的支持。    —— [百度百科](http://baike.baidu.com/link?url=vlR71k-FJO5znXeaUghn2u7BXXLi9B4K0_l1i345azAKmXmU-q8TgLxPYxqQJHQaDQgnd8RvjImY1nS7rSH5g_)


#### 代码块（Block）

而代码块是语法上由一些逻辑性语句组成的一个一个单元：

``` c
if (Condition) {
    // one Block
} else {
    // another Block
}
```

## 做

### 使用foldLeft方法计算一个列表中所有字符串的长度

#### 关于foldLeft和foldRight

##### foldLeft

Scala中 `foldLeft` 方法定义在[GenTraversableOnce.scala](https://github.com/scala/scala/blob/v2.11.6/src/library/scala/collection/GenTraversableOnce.scala#L1)文件中

``` scala
/** Applies a binary operator to a start value and all elements of this $coll,
 *  going left to right.
 *
 *  $willNotTerminateInf
 *  $orderDependentFold
 *
 *  @param   z    the start value.
 *  @param   op   the binary operator.
 *  @tparam  B    the result type of the binary operator.
 *  @return  the result of inserting `op` between consecutive elements of this $coll,
 *           going left to right with the start value `z` on the left:
 *           {{{
 *             op(...op(z, x_1), x_2, ..., x_n)
 *           }}}
 *           where `x,,1,,, ..., x,,n,,` are the elements of this $coll.
*/
 def foldLeft[B](z: B)(op: (B, A) => B): B
```

实现在[TraversableOnce.scala](https://github.com/scala/scala/blob/v2.11.6/src/library/scala/collection/TraversableOnce.scala#L1)里：

``` scala
  def foldLeft[B](z: B)(op: (B, A) => B): B = {
    var result = z
    this foreach (x => result = op(result, x))
    result
  }
```

方法接受两个参数，z 和 op， 其中z是B类型，op是一个返回类型为B类型的方法。其实该方法还有一个版本需要用到:/操作符，如下所示：

``` scala
 def /:[B](z: B)(op: (B, A) => B): B = foldLeft(z)(op)
```

该方法实际上是调用了foldLeft方法。举个例子：

``` scala
 scala> val list= List(1, 2, 3)
 list: List[Int] = List(1, 2, 3)

 scala> list.foldLeft(0)((sum, value) => sum + value)
 res6: Int = 6
```

`foldLeft`方法被传入一个初始值和一个代码块，这个代码块有两个参数sum 和 value，`foldLeft`将sum初始化为0，而value通过list遍历将list中每个元素累加到sum上，因此该行代码实现了对list中元素的累加。

##### foldRight

foldRight的实现如下：

``` scala
   def :\[B](z: B)(op: (A, B) => B): B = foldRight(z)(op)

   def foldRight[B](z: B)(op: (A, B) => B): B =
   reversed.foldLeft(z)((x, y) => op(y, x))
```

我们看到`foleRight`内部还是调用的foldLeft方法，不过多了一个reversed，它其实是该trait定义的内部方法，实现如下：

``` scala
  // @tparam A    the element type of the collection
  ...
  // for internal use
  protected[this] def reversed = {
    var elems: List[A] = Nil
    self foreach (elems ::= _)
    elems
  }
```

看来foldRight使用list的逆序集合然后再进行foldLeft，需要注意的是foldRight方法中需要传入的block**参数顺序**发生了变化，前者是列表参数（自己理解，不知所以）。这样的话，foldRight相对foldLeft来讲效率肯定就差一点了。下面是一个例子：

``` scala
scala> val list = List(1, 2, 3, 4, 5)
list: List[Int] = List(1, 2, 3, 4, 5)

scala> list.foldRight(100)((elem, sum) => sum - elem)
res10: Int = 85
```

**回归正题**

  题目中要求计算一个列表中字符串的长度之和也就迎刃而解，关键是明白foldLeft方法的使用。
``` scala
 scala> val numbers = List("one","two","three")
 numbers: List[String] = List(one, two, three)

 scala> val length = (0 /: numbers){(sum, elem) => sum + elem.length}
 length: Int = 11

 scala> val length2 = numbers.foldLeft(0)((sum, value)=> sum + value.length)
 length2: Int = 11
```

运算符 /: 和foldLeft方法均能实现需求（本质上一样一样的）

>  编写一个Censor trait，包含一个可将Pucky和Beans替换为Shoot和Darn的方法。使用映射存储脏话和他们的替代品

``` scala
import scala.collection.mutable.Map

trait Censor {
  val curseWords = Map("Pucky" -> "Shoot", "Beans" -> "Darn")
 
  def censor(s: String) = curseWords.foldLeft(s)((prev, curr) => prev.replaceAll(curr._1, curr._2))
}
 
class Text(words: String) extends Censor {
  def origin = words
 
  def transform = censor(words)
}
 
val text = new Text("Pucky && Beans")
println("Original String: " + text.origin)
println("Replaced String: " + text.transform)

输出结果：
$ scala Censor.trait 
Original String: Pucky && Beans
Replaced String: Shoot && Darn
```

>  从一个文件中加载脏话或者它们的替代品

通过针对scala对文件读写的讨论，就可以很轻松的写出这道题的答案，主要是需要将map中存储的映射关系存储下来进行读取。首先读取代码如下：

``` scala
import scala.collection.mutable.Map

trait fileRead {
  val curseWords = Map[String, String]()

  io.Source.fromFile("./files/censor.txt").getLines().foreach {
    (line) => val subWords = line.split(":")
    curseWords += (subWords(0) -> subWords(1))
  }

  println("After Read, curseWords are")
  curseWords.foreach(p => println(">>> key=" + p._1 + ", value=" + p._2 + " <<<"))
}

class tryFile extends fileRead

val fileObj = new tryFile
```

 写入文件代码如下：
 
``` scala
import scala.collection.mutable.Map
import java.io._

trait fileWrite {
  val curseWords = Map("Pucky"->"Shoot", "Beans"->"Darn")

  def writeMapToFile {
    println("Start to write map to file")

    val writer = new PrintWriter(new File("./files/curseToWrite.txt"))
    curseWords.foreach{
      (elem) => writer.write(elem._1 + ":" + elem._2)
      writer.write("\n")
    }
    writer.close()

      println("end to write map to file")
  }
}

class tryFile extends fileWrite

val fileObj = new tryFile
fileObj.writeMapToFile
```

That's all! 关于闭包的示例晚上回家补上~~~ 工作鸟


## 参考链接：
1. [http://www.tutorialspoint.com/scala/scala_file_io.htm](http://www.tutorialspoint.com/scala/scala_file_io.htm)
2. [http://blog.csdn.net/oopsoom/article/details/23447317](http://blog.csdn.net/oopsoom/article/details/23447317)
3. [http://zhangjunhd.github.io/2013/12/22/scala-note7-file.html](http://zhangjunhd.github.io/2013/12/22/scala-note7-file.html)

