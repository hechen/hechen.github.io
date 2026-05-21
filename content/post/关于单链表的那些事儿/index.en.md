---
title: 'Notes on singly linked lists'
slug: '关于单链表的那些事儿'
date: 2015-05-07T13:59:00+00:00
draft: false
categories: ['c++', 'data-structure', 'leetcode', 'scala']
tags: ['array', 'c++11', 'lambda', 'linked-list', 'linkedlist', 'string']
---

Cyclic singly linked lists — linked lists that contain a loop — come up in a lot of interview questions. This post is a roundup, partly for reference and partly to sort out my own thinking.

Figure 1 below shows a cyclic singly linked list. The head node is `H`, and the loop's entry point is `A`.

![Cyclic singly linked list — example](http://7xilk1.com1.z0.glb.clouddn.com/%E6%9C%89%E7%8E%AF%E5%8D%95%E9%93%BE%E8%A1%A8_1.jpg)

# Common questions about cyclic singly linked lists

1.  Does the list actually contain a loop?
2.  How do you find the entry point of the loop?
3.  How do you find the length of the loop?
4.  How do you find the total length of the list?

Let's go through them one by one.

## Detecting whether a singly linked list contains a loop

For the first question — confirming that a list actually contains a loop — there are three common approaches: external marking, internal marking, and the chase method.

External marking and internal marking are essentially the same idea — the only difference is whether the bookkeeping lives inside each node or in an external structure like an auxiliary array, hash table, AVL tree, or red-black tree. Either way, you record the addresses of nodes you've already visited and check on each step whether the next node has been seen before. I won't go deeper into that one. The interesting one is the chase method — also known as the *fast and slow pointer* method, which by now most people know cold.

The chase method relies on the lowest-common-multiple idea. You walk the list with two cursors, e.g. `pSlow` and `pFast`. `pSlow` advances one node per step and `pFast` advances two. If there's a loop, `pSlow` and `pFast` will eventually meet; if `pFast` ends up at `NULL`, the list has no loop. Since the two pointers move at different paces, they're called *fast and slow pointers*.

``` c
    // Definition for singly - linked list.
    struct ListNode {
        int val;
        ListNode *next;
        ListNode(int x) : val(x), next(nullptr) {}
    };

    bool isLoopList(ListNode *pHead){
        if (nullptr == pHead || nullptr == pHead->next){
            return false;
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

        return !(nullptr == pFast || nullptr == pFast->next);
    }
```

## Finding the entry point of the loop

For this one, we first need to show that when `pSlow` and `pFast` first meet, `pSlow` has not yet walked the entire list — and that, in fact, they haven't met exactly at the entry point either.

![Cyclic singly linked list](http://7xilk1.com1.z0.glb.clouddn.com/%E6%9C%89%E7%8E%AF%E5%8D%95%E9%93%BE%E8%A1%A8_2.jpg)

Look at the figure above (apologies for the rough sketch). Suppose that when `pSlow` reaches the loop's entry `A`, `pFast` is at some point `B` on the loop. Let `y` be the counterclockwise distance from `B` to `A`, and let the total loop length be `R`, so `y <= R`. Starting from `A`, after `pSlow` walks forward `y` steps, `pFast` walks forward `2 * y` steps from `B` — they meet at some point `D`. At that moment `pSlow` still needs to walk `R - y` more steps to get back around to `A`. Since `y <= R`, we have `R - y >= 0`. QED.

![Cyclic singly linked list](http://7xilk1.com1.z0.glb.clouddn.com/%E6%9C%89%E7%8E%AF%E5%8D%95%E9%93%BE%E8%A1%A8_3.jpg)

Now suppose `pSlow` walked `s` steps before the meeting, so `pFast` walked `2 * s`. The extra distance `pFast` covered must consist of full loops, which gives us:

`2 * s = s + n * R; (n >= 1)`

Therefore `s = n * R (n >= 1)`.

Let the total length of the list be `L`, the distance from `H` to `A` be `a`, and the distance from the first meeting point `B` to `A` be `x`. Then:

`a + x = s = n * R;`

`a + x = (n - 1 + 1) * R = (n - 1) * R + R = (n - 1) * R + L - a;`

So `a = (n - 1) * R + (L - a - x)`. From the earlier derivation we know `L - a - x` is the value we called `y`. Therefore `a = (n - 1) * R + y; (n >= 1)`.

So here's the trick: put one pointer at the meeting point and another at the head, then advance both one step at a time. The next time they meet, the meeting-point pointer will have walked exactly `y + (n - 1) * R` steps — landing it on entry point `A`. QED. The implementation:

``` c
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

        // 此时调整两个指针为普通指针，一次一步，并且其中一个指针从头部开始，第一次相遇点一定是环的入口点
        pSlow = pHead;
        while (pFast != pSlow){
            pFast = pFast->next;
            pSlow = pSlow->next;
        }

        return pSlow;
    }
```

## Finding the length of the loop

With the above in place, the loop length is easy: we know the entry point, so just walk one full lap around the loop.

## Finding the total length of the list

By the same token, once `R` is known, and from question 2 we know `a` (the distance from the head pointer to the entry point), the total length of the linked list is `L = R + a`.
