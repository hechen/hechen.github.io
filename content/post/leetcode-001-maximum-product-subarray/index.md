---
title: '[152] Maximum Product Subarray'
date: 2015-04-29T11:30:00+00:00
draft: false
categories: ['leetcode', 'scala']
tags: ['array']
---

### 题目：

Find the contiguous subarray within an array (containing at least one number) which has the largest product.
For example, given the array \[2,3,-2,4\], the contiguous subarray \[2,3\] has the largest product = 6.

### 题意：

题目中给出一个（至少包含一个元素）整形数组，求一个子数组（元素连续），使得其元素之积最大。最直接了当的方法，当然是暴力穷举，但是其O(n^2)是无法通过 OJ 评判的。

C语言实现如下：

``` c
    int maxProduct(int* nums, int numsSize) {
            int nMaxPro = nums[0];
            int max_tmp = nums[0];
            int min_tmp = nums[0];

            for(int i = 1; i< numsSize; ++i){
                int a = nums[i] * max_tmp;
                int b = nums[i] * min_tmp;

                max_tmp = (( a > b ? a : b ) > nums[i]) ? ( a > b ? a : b ) : nums[i];
                min_tmp = (( a < b ? a : b ) < nums[i]) ? ( a < b ? a : b ) : nums[i];

                nMaxPro = (nMaxPro > max_tmp) ? nMaxPro : max_tmp;
            }

            return nMaxPro;
    }
```

C++实现如下：

``` c
    class Solution {
        public:
            int maxProduct(vector<int>& nums) {
                int nMaxPro = nums[0];
                int max_tmp = nums[0];
                int min_tmp = nums[0];

                for(int i = 1; i< nums.size(); ++i){
                    int a = nums[i] * max_tmp;
                    int b = nums[i] * min_tmp;

                    max_tmp = (( a > b ? a : b ) > nums[i]) ? ( a > b ? a : b ) : nums[i];
                    min_tmp = (( a < b ? a : b ) < nums[i]) ? ( a < b ? a : b ) : nums[i];

                    nMaxPro = (nMaxPro > max_tmp) ? nMaxPro : max_tmp;
                }

                return nMaxPro;
            }
    };
```

Java实现如下：

``` java
   public class Solution {
         public int maxProduct(int[] nums) {
            int nMaxPro = nums[0];
            int max_tmp = nums[0];
            int min_tmp = nums[0];

            for(int i = 1; i< nums.length; ++i){
                int a = nums[i] * max_tmp;
                int b = nums[i] * min_tmp;

                max_tmp = (( a > b ? a : b ) > nums[i]) ? ( a > b ? a : b ) : nums[i];
                min_tmp = (( a < b ? a : b ) < nums[i]) ? ( a < b ? a : b ) : nums[i];

                nMaxPro = (nMaxPro > max_tmp) ? nMaxPro : max_tmp;
            }

            return nMaxPro;
        }
    }
    
```
