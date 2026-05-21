---
title: '[160] Intersection of Two Linked Lists'
slug: 'leetcode-003-intersection-of-two-linked-lists'
date: 2015-04-29T12:28:00+00:00
draft: false
categories: ['c++', 'leetcode', 'scala']
tags: ['array', 'c++11', 'lambda', 'linkedlist']
---

### Problem: Intersection of Two Linked Lists

Write a program to find the node at which the intersection of two
singly linked lists begins.

　　　　For example, the following two linked lists:

　　　　　　A: a1 → a2
　　　　　　　　　　　　↘
　　　　　　　　　　　　 c1 → c2 → c3
　　　　　　　　　　 ↗ 　　　
B: b1 → b2 → b3 　　
　begin to intersect at node c1.

　　Notes:
　　　　1. If the two linked lists have no intersection at all, return null.
　　　　2. The linked lists must retain their original structure after the function returns.
　　　　3. You may assume there are no cycles anywhere in the entire linked structure.
　　　　4. Your code should preferably run in O(n) time and use only O(1) memory

### What it's asking

Given two singly linked lists, decide whether they intersect and return the intersection node. Here are a few approaches. All code in this post is C++; I'll add other languages later.

#### Solution 1

The book *Beauty of Programming* covers this problem. To check whether two lists intersect, connect the tail of one list back to its own head, then ask whether the other list, viewed from its perspective, now contains a cycle. That reduces the problem to: find the entry point of the cycle in a cyclic singly linked list. For the detailed solution see my other post dedicated to cyclic singly linked lists, "Things about cyclic singly linked lists." One gotcha: we can't permanently modify the original structure, so the function has to restore everything before returning.

　　1. Point list B's tail node to its own head `HeadB`, so list B becomes cyclic and list A becomes a list that contains a cycle;
　　2. The problem is now: find the cycle entry point on list A;
　　3. Restore list B's original structure.

　　Code:

``` c
    /**
         *   Definition for singly-linked list.
         * struct ListNode {
         *     int val;
         *     ListNode *next;
         *     ListNode(int x) : val(x), next(NULL) {}
         * };
         */
        class Solution {
            public:
                ListNode *getIntersectionNode(ListNode *headA, ListNode *headB) {
                        if (nullptr == headA || nullptr == headB){
                                return nullptr;
                        }

                        ListNode *pNode = headB;
                        while (pNode->next){
                            pNode = pNode->next;
                        }
                
                        ListNode *pRear = pNode;
                        pNode->next = headB;

                        ListNode *pJoint = loopJoint(headA);
                        pRear->next = nullptr;   // 恢复

                        return pJoint;
                }
        
        private:    
                ListNode *loopJoint(ListNode *pHead){
                if (nullptr == pHead || nullptr == pHead->next){
                    return nullptr;
                }

                ListNode *pSlow = pHead;
                ListNode *pFast = pHead;
                while (pFast && pFast->next){
                    pFast = pFast->next->next;
                    pSlow = pSlow->next;

                    if (pFast == pSlow){
                        break;
                    }
                }

                if (nullptr == pFast || nullptr == pFast->next){
                    return nullptr;
                }

                pSlow = pHead;
                while (pFast != pSlow){
                    pFast = pFast->next;
                    pSlow = pSlow->next;
                }

                return pSlow;
            }
    }
```

LeetCode OJ result:

![leetCode C++ Solution1](http://7xilk1.com1.z0.glb.clouddn.com/leetCode002C++1.png)

#### Solution 2

The book *Coding Interviews* mentions this one. If two acyclic lists intersect at some node, every node from that point on is shared. So the length difference between the two whole lists equals the length difference of the portions *before* the intersection. If we line the two lists up so their pointers sit at the same distance from the intersection, then walk them in lockstep, we'll meet at the intersection in O(n) steps.

　　1. Walk list A, record its length `len1`. Walk list B, record its length `len2`.
　　
　　2. Align by the tail: if the lengths differ, advance the longer list's pointer by `abs(len1 - len2)` first, so both pointers are at the same distance from the tail.

　　3. Now advance both pointers together. When they're equal, that's the intersection node.

　　Time O(n + m), space O(1).

　　Code:

``` c
     /**
                 * Definition for singly-linked list.
                 * struct ListNode {
                 *     int val;
                 *     ListNode *next;
                 *     ListNode(int x) : val(x), next(NULL) {}
                 * };
          */
    class Solution {
        public:
            ListNode *getIntersectionNode(ListNode *headA, ListNode *headB) {
                if (nullptr == headA || nullptr == headB){
                return nullptr;
            }

            int nLongLength = 0;
            int nShortLength = 0;
            ListNode *pLongList = headA;
            ListNode *pShortList = headB;

            while (pLongList){
                ++nLongLength;
                pLongList = pLongList->next;
            }

            while (pShortList){
                ++nShortLength;
                pShortList = pShortList->next;
            }

            if (nShortLength > nLongLength){
                pLongList = headB;
                pShortList = headA;

                // 校正
                nLongLength ^= nShortLength;
                nShortLength ^= nLongLength;
                nLongLength ^= nShortLength;
            }
            else{
                pLongList = headA;
                pShortList = headB;
            }
    
            int offset = nLongLength - nShortLength;
            while (offset> 0){
                pLongList = pLongList->next;
                --offset;
            }
    
            while (pLongList != pShortList){
                pLongList = pLongList->next;
                pShortList = pShortList->next;
            }
    
            return pLongList;
        }
    }
```

LeetCode OJ result:

![leetCode C++ Solution 2](http://7xilk1.com1.z0.glb.clouddn.com/leetCode002C++2.png)

#### Solution 3

One more approach — it also relies on a step-difference trick. I haven't fully worked out the proof yet, still thinking about it. The idea:

　　1. Keep two pointers `pA` and `pB`, initially at the heads of A and B. Walk both, one node at a time.

　　2. When `pA` hits the end of A, point it at the head of B. Likewise, when `pB` hits the end of B, point it at the head of A.

　　3. When `pA` and `pB` meet, that meeting point is the intersection.

　　Time O(m + n), space O(1).

Code:

``` c
    /**
         * Definition for singly-linked list.
         * struct ListNode {
         *     int val;
         *     ListNode *next;
         *     ListNode(int x) : val(x), next(NULL) {}
         * };
     */
    class Solution {
        public:
            ListNode *getIntersectionNode(ListNode *headA, ListNode *headB) {
                if (nullptr == headA || nullptr == headB){
                    return nullptr;
                }
    
            ListNode *nodeA = headA;
            ListNode *nodeB = headB;
            while (nodeA && nodeB && nodeA != nodeB){
                nodeA = nodeA->next;
                nodeB = nodeB->next;
    
                if (nodeA == nodeB){
                    break;
                }
    
                if (nullptr == nodeA){
                    nodeA = headB;
                }
    
                if (nullptr == nodeB){
                    nodeB = headA;
                }
            }
    
            return nodeA;
        }
    }
    
```

LeetCode OJ result:

![leetCode C++ Solution3](http://7xilk1.com1.z0.glb.clouddn.com/leetCode002C++3.png)
