---
title: "leetCode[003]Two Sum"
date: 2015-04-29 13:15:00
categories: ["LeetCode"]
tags: ["Array"]
---

本文主要包括leetCode题集里的两个题目，Two Sum1 和 Two Sum2

<!-- more -->

### 题目1： Two Sum 1

Given an array of integers, find two numbers such that they add up to a specific target number.

The function twoSum should return indices of the two numbers such that they add up to the target, 
where index1 must be less than index2. Please note that your returned answers (both index1 and index2) are not zero-based.

You may assume that each input would have exactly one solution.

　　　　Input: numbers={2, 7, 11, 15}, target=9
　　　　Output: index1=1, index2=2

#### 题意：

题目中要求输入一个整形数组以及一个target，找出该整型数组中这样两个元素，使得这两个元素之和等于指定target的值。 题目中假设该两个元素必然存在，并且是只有一组（所以相对简单），返回的是这两个元素的index值（数组Index从1开始）。

#### 关键点：

我们经常会使用空间换取时间的方法来获取较小的时间复杂度。因此增加必要的数据结构来减少时间复杂度。这道题目一样，我们增加一个map结构，key为数组元素值，value为其在数组中对应的index。每次遍历到数组元素便去map结构中查找对应的补数，如果存在，那就说明找到了。如果没存在就记录当前元素以及其index，直到结束。

代码实现如下：

   
``` C++
 
class Solution{
		public:
	     // O(n) runtime, O(n) space
	     // We could reduce the runtime complexity of looking up a value to O(1) using a hash map that maps a value to its index.
	    std::vector<int> twoSum(std::vector<int>& numbers, int target){
	        std::vector<int> vecRet;
	        std::map<int, int> mapIndex;
	        for (size_t i = 0; i < numbers.size(); ++i){
	            if (0 != mapIndex.count(target - numbers[i])){
	                int nIndex = mapIndex[target - numbers[i]];
	                // 当前存储的Index肯定比i要小，注意要排除i
	                if (nIndex < i){
	                    vecRet.push_back(nIndex + 1);
	                    vecRet.push_back(i + 1);
	                    return vecRet;
	                }
	            } else {
	                mapIndex[numbers[i]] = i;
	            }
	        }
	        return vecRet;
	    } // twoSum
	}

```


leetCode的OJ系统评判结果如下所示：
![leetCode Two Sum 1 C++](http://7xilk1.com1.z0.glb.clouddn.com/leetCode003C++.png)

本地运行结果如下所示：
![leetCode Two Sum 1 C++  Run](http://7xilk1.com1.z0.glb.clouddn.com/leetCode003Run1.jpg)


### 题目2：Two Sum 2
Given an array of integers, find two numbers such that they add up to a specific target number.

The function twoSum should return indices of the two numbers such that they add up to the target, where index1 must be less than index2. Please note that your returned answers (both index1 and index2) are not zero-based.

You may assume that each input would have exactly one solution.

**Input**: numbers={2, 7, 11, 15}, target=9
**Output**: index1=1, index2=2


#### 题意：
和上题中Two Sum1 比较，大家发现什么异同了没（没发现的童鞋面壁去），这道题目仅仅更改了输入条件，Input的数组为已经排序的数组，并且呈现升序。输入条件变严格，我们依然可以使用前一篇问丈夫中的方法进行。那这里既然为升序，我们能不能不使用前一种方法而又能够达到O（n）时间复杂度呢？ 答案是必然的。

#### 关键点：
1. 数组既然排序，元素之前的大小关系相对确定，存在的这一对元素必然处于相对固定的位置，我们可以使用两个游标，一个从头部遍历，一个从尾部遍历，两者所指元素之和如果偏大，调整后面的游标，相反则调整前面的游标。
2.  由于两个int之和有可能出现INT_MAX的情况，所以如果输入类型给定int，则我们需要使用long long类型来表示才能避免出现溢出的情况。

实现代码如下：

``` C++
    class Solution{
		public:
	        std::vector<int> twoSum(std::vector<int> &numbers, int target){
	        std::vector<int> vecRet;
	        int nLeft = 0;
	        int nRight = numbers.size() - 1;
	
	        while (nLeft < nRight){
	            // 小心两个int之和溢出，使用long long类型
	            long long int nAdd = numbers[nLeft] + numbers[nRight];
	            if (nAdd == target){
	                vecRet.push_back(nLeft + 1);
	                vecRet.push_back(nRight + 1);
	
	                return vecRet;
	            }
	            else if (nAdd > target){
	                nRight--;
	            }
	            else if (nAdd < target){
	                nLeft++;
	            }
	        }
	
	        return vecRet;
	    } 
	}

```


由于Two Sum2 题目是收费的，因此木有进行leetCode的OJ评判，直接上本地运行截图吧，sign~

![leetCode Two Sum 2  Run](http://7xilk1.com1.z0.glb.clouddn.com/leetCode003Run2.jpg)
