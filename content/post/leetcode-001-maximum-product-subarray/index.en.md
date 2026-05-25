---
title: '[152] Maximum Product Subarray'
slug: 'leetcode-001-maximum-product-subarray'
date: 2015-04-29T11:30:00+00:00
draft: false
categories: ['leetcode', 'scala']
tags: ['array']
---

### Problem

Find the contiguous subarray within an array (containing at least one number) which has the largest product.
For example, given the array \[2,3,-2,4\], the contiguous subarray \[2,3\] has the largest product = 6.

### Read

You're given an integer array (with at least one element); find a contiguous subarray whose elements multiply to the largest product. The most direct approach is brute force, but its O(n²) won't pass the OJ.

The trick: at each step, track both the maximum and minimum running products — because a negative times a negative becomes positive, today's minimum can become tomorrow's maximum.

C version:

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

C++ version:

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

Java version:

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
