---
title: '[018] Length Of Last Word'
slug: 'leetcode-018-lengthoflastword'
date: 2015-08-18T16:13:44+00:00
draft: false
categories: ['data-structure', 'ios', 'leetcode']
tags: ['algorithm', 'array', 'ios', 'linked-list', 'linkedlist', 'notification', 'push', 'string']
---

### Problem

Given a string s consists of upper/lower-case alphabets and empty space characters ' ', return the length
of last word in the string.
If the last word does not exist, return 0.
Note: A word is defined as a character sequence consists of non-space characters only.
For example, Given s = "Hello World", return 5.

### Read

Not hard — you just have to handle the edge cases.

### Solution

C++ version, approach 1:

``` c
   // walk from right to left
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

The LeetCode OJ result is below:

![leetCode C++1](http://7xilk1.com1.z0.glb.clouddn.com/leetCode018C++1.png)

;

C++ version, approach 2:

``` c
    // use STL — let the standard library do the work
class Solution {
    public:
        int lengthOfLastWord(string s) {
            auto left = find_if(s.rbegin(), s.rend(), ::isalpha);
            auto right = find_if_not(left, s.rend(), ::isalpha);
            return distance(left, right);
        }
    }
    
```

The LeetCode OJ result is below:

![leetCode C++2](http://7xilk1.com1.z0.glb.clouddn.com/leetCode018C++2.png)

;
