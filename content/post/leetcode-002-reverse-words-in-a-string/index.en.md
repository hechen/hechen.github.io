---
title: '[151] Reverse Words in a String'
slug: 'leetcode-002-reverse-words-in-a-string'
date: 2015-05-01T09:29:09+00:00
draft: false
categories: ['c++', 'leetcode', 'scala']
tags: ['array', 'c++11', 'lambda', 'linkedlist', 'string']
---

### Problem: Reverse Words in a String

Given an input string s, reverse the string word by word.
For example, given s = "the sky is blue", return "blue is sky the".

### Read

The intent is clear — flip the words in the string to form a new one. But there are a few questions worth thinking about (from LeetCode's official CleanCodeBook):

Q: What constitutes a word?
A: A sequence of non-space characters constitutes a word.

Q: Does tab or newline character count as space characters?
A: Assume the input does not contain any tabs or newline characters.

Q: Could the input string contain leading or trailing spaces?
A: Yes. However, your reversed string should not contain leading or trailing spaces.

Q: How about multiple spaces between two words?
A: Reduce them to a single space in the reversed string.

#### Solution

``` c
class Solution {
public:
    void reverseWords(std::string &s) {
        
       std::string reversed("");
        int j = s.length();

        for (int i = s.length() - 1; i >= 0; --i) {
            if(s.at(i) == ' ') j = i;
            else if (i == 0 || s.at(i - 1) == ' ') {
                if (reversed.length() != 0) reversed += ' ';
                reversed += s.substr(i, j - i);
            }
        }
        s = reversed;
    }
}
```
