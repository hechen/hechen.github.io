---
title: '[28] Implement strStr()'
slug: 'leetcode-021-implementstrstr'
date: 2015-08-21T09:14:17+00:00
draft: false
categories: ['leetcode']
tags: ['algorithm', 'array', 'linkedlist', 'string', 'tree']
---

# Problem: 28. Implement strStr()

Implement strStr().

Returns the index of the first occurrence of needle in haystack, or -1 if needle is not part of haystack.

## What it's asking

Implement `strstr()`. The C signature is below — it returns the position of `str1` within `str2`.

``` text
extern char *strstr(char *str1, const char *str2);
```

## Solutions

### Brute force

The most direct implementation is brute force, as shown below:

``` c
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

In the worst case, the brute-force substring search needs O(NM) character comparisons to find a pattern of length M inside a text of length N.

We can rewrite the implementation slightly to make the backtracking of `i` more visible. When the character at `i` and the character at `j` mismatch, `i` backs up by `j` positions (`j` here being the number of matched pattern characters before the mismatch), and `j` resets to the start of the pattern. This version is equivalent to the one above:

``` c
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
            else {  i -= j; j = 0; }
        }
        if (j == M) return i - M;
        else return -1;
    }
}
```

Now you can plainly see this: when the pattern's `j`-th character doesn't match, we already know something about the text from the partial match we just made. If we can use that information, we can shift the pattern more aggressively. KMP is exactly that — it uses information from the partial match before the failure, keeps the text pointer from backing up, and only moves the pattern.

### KMP

[KMP](https://en.wikipedia.org/wiki/Knuth%E2%80%93Morris%E2%80%93Pratt_algorithm) is commonly used to find the position of a pattern string P inside a text string S. It was discovered independently by Donald Knuth, Vaughan Pratt, and James H. Morris — the algorithm takes its name from their three surnames.

[july's blog](http://blog.csdn.net/tukangzheng/article/details/38438481) has by far the most detailed write-up I've seen.

KMP implementation:

``` c
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
                else { i--; j = next[j]; }  // i维持不变，j跳转位置由next数组决定
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
