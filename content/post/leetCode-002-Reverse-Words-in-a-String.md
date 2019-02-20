---
title: "leetCode[002]Reverse Words in a String"
date: 2015-05-01 09:29:09
categories: ["LeetCode"]
tags: ["String"]
---

### 题目：Reverse Words in a String

Given an input string s, reverse the string word by word.
For example, given s = "the sky is blue", return "blue is sky the".

<!-- more -->

### 题意：

题意很明确，将字符串中的单词进行翻转，形成新的字符串。但是这其中有几个问题我们需要思考（参考leetCode官方CleanCodeBook）：

Q: What constitutes a word?
A: A sequence of non-space characters constitutes a word.

Q: Does tab or newline character count as space characters?
A: Assume the input does not contain any tabs or newline characters.

Q: Could the input string contain leading or trailing spaces?
A: Yes. However, your reversed string should not contain leading or trailing spaces.

Q: How about multiple spaces between two words?
A: Reduce them to a single space in the reversed string.

#### 解法：

``` C++

class Solution {
public:
	void reverseWords(std::string &s) {		
	    std::string reversed("");
		int j = s.length();

		for (int i = s.length() - 1; i >= 0; --i) {
			if(s.at(i) == ' ') j = i;
			else if (i == 0 || s.at(i - 1) == ' '){
				if (reversed.length() != 0) reversed += ' ';
				reversed += s.substr(i, j - i);
			}
		}
		s = reversed;
	}
}

```


leetCode的OJ系统评判结果：
![leetCode C++  Solution3](http://7xilk1.com1.z0.glb.clouddn.com/leetCode_ReverseWordsInAString_C++.png)

