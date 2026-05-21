---
title: 'Two Sum'
slug: 'leetcode-003-two-sum'
date: 2015-04-29T13:15:00+00:00
draft: false
categories: ['c++', 'leetcode', 'scala']
tags: ['array', 'c++11', 'lambda', 'linkedlist']
---

This post covers two LeetCode problems: Two Sum I and Two Sum II.

# Problem 1: 1. Two Sum

Given an array of integers, find two numbers such that they add up to a specific target number.

The function twoSum should return indices of the two numbers such that they add up to the target,
where index1 must be less than index2. Please note that your returned answers (both index1 and index2) are not zero-based.

You may assume that each input would have exactly one solution.

　　　　Input: numbers={2, 7, 11, 15}, target=9
　　　　Output: index1=1, index2=2

## What it's asking

Given an integer array and a target, find two elements whose sum equals the target. The problem guarantees that exactly one such pair exists (which makes things easier), and you return the 1-based indices of the two elements.

## The trick

A common technique is to trade space for time to bring the time complexity down. We add a map: the key is the array element's value, the value is its index in the array. As we walk the array, we look up `target - current` in the map. If it's there, we've found the pair. If not, we record the current element and its index and keep going.

Code:

``` c
 
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

# Problem 2: 167. Two Sum II - Input array is sorted

Given an array of integers, find two numbers such that they add up to a specific target number.

The function twoSum should return indices of the two numbers such that they add up to the target, where index1 must be less than index2. Please note that your returned answers (both index1 and index2) are not zero-based.

You may assume that each input would have exactly one solution.

**Input**: numbers={2, 7, 11, 15}, target=9
**Output**: index1=1, index2=2

## What it's asking

Spot the difference with Two Sum I? (If you don't, go stand in the corner.) The only change is the input: the array is already sorted in ascending order. Since the input is more constrained, we could still use the approach from before — but given that the array is sorted, can we do it in O(n) without the hash map? Of course we can.

## The trick

1. Since the array is sorted, the relative ordering of elements is known, and the pair we're looking for sits at a relatively fixed position. So we can use two pointers — one starting from the head, one from the tail. If their sum is too large, move the right pointer in; if too small, move the left pointer forward.
2. Two `int`s can overflow when added (think `INT_MAX`), so if the inputs are typed as `int` we need `long long` for the sum to be safe.

Code:

``` c
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
