---
title: "leetCode[018]Length Of Last Word"
date: 2015-08-18 16:13:44
categories: ["LeetCode"]
tags: ["Algorithm","String"]
---

### 题目：
  Given a string s consists of upper/lower-case alphabets and empty space characters ' ', return the length
  of last word in the string.
  If the last word does not exist, return 0.
  Note: A word is defined as a character sequence consists of non-space characters only.
			For example, Given s = "Hello World", return 5.
			
			
<!-- more -->

### 题意：
难度不大，考虑所有边界情况即可。

### 解法：
C++版本实现方法1：
		
	

``` C++
   // 从右往左依次遍历即可
  class Solution {
	public:
		int lengthOfLastWord(string s) {
			int length = 0;
			for (int index = s.length() - 1; index >= 0; index--){
				char c = s.at(index);
				if (c != ' '){
					length++;
				}
				else if (c == ' ' && length != 0){
					return length;
				}
			}
			return length;
		}
	}
```
leetCode Oj系统评判结果如下图所示：

![leetCode C++1](http://7xilk1.com1.z0.glb.clouddn.com/leetCode018C++1.png);

C++版本实现方法2：

``` C++
	// 直接利用现有轮子STL 
class Solution {
	public:
		int lengthOfLastWord(string s) {
			auto left = find_if(s.rbegin(), s.rend(), ::isalpha);
			auto right = find_if_not(left, s.rend(), ::isalpha);
			return distance(left, right);
		}
	}
```

leetCode Oj系统评判结果如下图所示：

![leetCode C++2](http://7xilk1.com1.z0.glb.clouddn.com/leetCode018C++2.png);

