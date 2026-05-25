---
title: 'Scala Day 2'
slug: 'scala第二天'
date: 2015-04-16T18:43:00+00:00
draft: false
categories: ['scala']
---

I've been working through the Coursera course [Principles of Reactive Programming](https://class.coursera.org/reactive-002) the past few days. I hadn't realised it expected a solid foundation in at least one functional language, so I'm cramming. I happened to have an unread copy of *Seven Languages in Seven Weeks* lying around, so I'm using the course as the kick I needed to actually crack it open — though just the Scala chapter. Today I'm on Day 2, and the headline topic is Collections. This post is mostly my notes on the exercises.

## Find

### How to work with files in Scala

Because Scala can use any object from Java, you can lean on Java's file APIs — `java.io.File` is one of them. Example:

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

To read a file from disk, Scala has its own library support. Here's a snippet that reads a local file and prints its contents:

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

### What's the difference between a closure and a code block?

I had to piece together the closure concept from the web plus my own understanding.

#### Closure

> A closure is a block of code that can contain free variables (not bound to any specific object). These variables aren't defined inside the block or in any global context, but rather in the environment where the block was defined (i.e. they're local variables of an enclosing scope). The name "closure" comes from combining two things: the block of code to be executed (whose free variables, and the objects they reference, aren't released because they're captured inside the block) and the computation environment (scope) that supplies the bindings for those free variables. You'll find closure support, to varying degrees, in Scala, Scheme, Common Lisp, Smalltalk, Groovy, JavaScript, Ruby, Python, Go, Lua, Objective-C, and Java (Java 8+). — [Baidu Baike](http://baike.baidu.com/link?url=vlR71k-FJO5znXeaUghn2u7BXXLi9B4K0_l1i345azAKmXmU-q8TgLxPYxqQJHQaDQgnd8RvjImY1nS7rSH5g_)

#### Code block

A code block, syntactically, is a unit made up of logically grouped statements:

``` c
if (Condition) {
    // one Block
} else {
    // another Block
}
```

## Do

### Using `foldLeft` to compute the total length of all strings in a list

#### About `foldLeft` and `foldRight`

##### foldLeft

Scala's `foldLeft` is declared in [GenTraversableOnce.scala](https://github.com/scala/scala/blob/v2.11.6/src/library/scala/collection/GenTraversableOnce.scala#L1):

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

and implemented in [TraversableOnce.scala](https://github.com/scala/scala/blob/v2.11.6/src/library/scala/collection/TraversableOnce.scala#L1):

``` scala
  def foldLeft[B](z: B)(op: (B, A) => B): B = {
    var result = z
    this foreach (x => result = op(result, x))
    result
  }
```

It takes two arguments, `z` and `op`: `z` is of type B, and `op` is a function whose return type is also B. There's also a version that uses the `/:` operator:

``` scala
 def /:[B](z: B)(op: (B, A) => B): B = foldLeft(z)(op)
```

which is really just `foldLeft` under a different name. An example:

``` scala
 scala> val list= List(1, 2, 3)
 list: List[Int] = List(1, 2, 3)

 scala> list.foldLeft(0)((sum, value) => sum + value)
 res6: Int = 6
```

`foldLeft` is handed an initial value plus a block taking two parameters — `sum` and `value`. `foldLeft` starts `sum` at 0 and walks the list, accumulating each element into `sum`. So that single line sums the list.

##### foldRight

`foldRight` is implemented like this:

``` scala
   def :\[B](z: B)(op: (A, B) => B): B = foldRight(z)(op)

   def foldRight[B](z: B)(op: (A, B) => B): B =
   reversed.foldLeft(z)((x, y) => op(y, x))
```

So `foldRight` is actually defined in terms of `foldLeft` — with an extra `reversed` step. `reversed` is an internal method on the trait:

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

So `foldRight` reverses the collection first and then does a `foldLeft` over it. Note that the **parameter order** in the block passed to `foldRight` is flipped — the list element comes first (that's my read of it, anyway). And because of the extra reversal step, `foldRight` is a bit less efficient than `foldLeft`. Example:

``` scala
scala> val list = List(1, 2, 3, 4, 5)
list: List[Int] = List(1, 2, 3, 4, 5)

scala> list.foldRight(100)((elem, sum) => sum - elem)
res10: Int = 85
```

**Back to the original problem**

Once you understand `foldLeft`, summing the string lengths in a list falls right out:

``` scala
 scala> val numbers = List("one","two","three")
 numbers: List[String] = List(one, two, three)

 scala> val length = (0 /: numbers){(sum, elem) => sum + elem.length}
 length: Int = 11

 scala> val length2 = numbers.foldLeft(0)((sum, value)=> sum + value.length)
 length2: Int = 11
```

`/:` and `foldLeft` both get us there (and they're really the same thing under the hood).

> Write a Censor trait with a method that swaps "Pucky" and "Beans" for "Shoot" and "Darn". Use a map to store the curse words and their replacements.

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

> Load the curse words and their replacements from a file.

With the earlier discussion of file I/O in Scala, this one's easy — you just need to persist the map's key/value pairs on disk and read them back. Here's the read side:

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

And the write side:

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

That's it! I'll add the closure example later tonight when I'm back from work.

## References

1.  [http://www.tutorialspoint.com/scala/scala\_file\_io.htm](http://www.tutorialspoint.com/scala/scala_file_io.htm)
2.  [http://blog.csdn.net/oopsoom/article/details/23447317](http://blog.csdn.net/oopsoom/article/details/23447317)
3.  [http://zhangjunhd.github.io/2013/12/22/scala-note7-file.html](http://zhangjunhd.github.io/2013/12/22/scala-note7-file.html)
