---
title: "[28] Implement strStr()"
date: 2015-08-21 09:14:17
categories: ["LeetCode"]
tags: ["Algorithm","String"]
---

# 题目：28. Implement strStr()

Implement strStr().

Returns the index of the first occurrence of needle in haystack, or -1 if needle is not part of haystack.

<!-- more -->

## 题意：

该题目就是实现strstr()函数，该函数C语言原型如下：返回字符串str1在str2中的位置。

```
extern char *strstr(char *str1, const char *str2);
```


## 解法：

### 暴力求解法

最直接的实现方式就是暴力求解法，如下代码所示，

``` C++
class Solution {
	public:
		int strStr(string haystack, string needle) {
			return bruth(haystack, needle);
		}

	private:
		int bruth(string text, string pattern) {
			int M = pattern.length();
			int N = text.length();
			if (M == 0) return 0;
			if (N == 0) return -1;
			for (int i = 0; i <= N - M; ++i) {
				int j = 0;
				for (; j < M; ++j) {
					if (text.at(i + j) != pattern.at(j))
						break;
				}
				if (j == M) return i;
			}
			return -1;
		}
}

```

在最坏的情况下，暴力子字符串查找算法在长度为N的文本中查找长度为M的模式字符串需要O(NM)次字符串比较。

我们可以将上面的实现方法进行一定的修改，让大家能看到i指针的回退，如下代码所示，当i指针指向字符和j指向字符发生失配，i便会回退j个位置（此时j是失配前模式串的匹配项个数），同时j指向模式串的第一个位置。该段代码和上面代码其实是等效的。

``` C++

class Solution {
public:
	int strStr(string haystack, string needle) {
		return bruth(haystack, needle);
	}

private:
	int bruth(string text, string pattern) {
		int M = pattern.length();
		int N = text.length();
		if (M == 0) return 0;
		if (N == 0) return -1;
		int i = 0;
		int j = 0;
		for (; i < N && j < M; ++i) {
			if (text.at(i) == pattern.at(j)) j++;
			else {	i -= j; j = 0; }
		}
		if (j == M) return i - M;
		else return -1;
	}
}

```

那我们就可以很明显的看到，当模式串中j指向位置字符不匹配的时候，其实前面通过匹配我们已经获知了一部分文本的情况，因此如果能够利用这一部分已知的情况来加大模式串移动的有效性。KMP算法就是利用字符串匹配失效之前部分匹配的这个有用信息，通过保持文本指针不回退，仅有效移动模式字符串的位置来进行有效查找的。


### KMP算法

[KMP算法](https://en.wikipedia.org/wiki/Knuth%E2%80%93Morris%E2%80%93Pratt_algorithm)常用于在一个文本串S内查找一个模式串P 的出现位置，这个算法由Donald Knuth、Vaughan Pratt、James H. Morris三人同时独立发现，后取这3人的姓氏命名此算法.
大家可以参看[july的Blog](http://blog.csdn.net/tukangzheng/article/details/38438481)，讲解的是我目前看到最详细的了。

KMP算法实现：

```C++
 class Solution {
	public:
		int strStr(string haystack, string needle) {
			return kmp(haystack, needle);
		}
	private:
		// KMP
		int kmp(string text, string pattern) {
			int M = pattern.length();
			int N = text.length();
			if (M == 0) return 0;
			if (N == 0) return -1;
			int i = 0;
			int j = 0;
	
			int* next = new int[M];
			calculateNext(pattern, next);
			for (; i < N && j < M; ++i) {
				if ( j == -1 || text.at(i) == pattern.at(j) ) j++;
				else { i--; j = next[j]; }	// i维持不变，j跳转位置由next数组决定
			}
			delete[] next;
	
			if (j == M) return i - M;
			else return -1;
		}
		void calculateNext(string pattern, int* next) {
			if (pattern.length() == 0 || next == nullptr) return;
			next[0] = -1;
			int i = 0;
			int k = -1;
			while (i < pattern.length() - 1) {
				if (k == -1 || pattern.at(k) == pattern.at(i)) {
					++i;
					++k;
					next[i] = k;
				}
				else {
					k = next[k];
				}
			}
		}
	}

```