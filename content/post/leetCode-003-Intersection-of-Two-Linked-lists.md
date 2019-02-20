---
title: "[002] Intersection of Two Linked lists"
date: 2015-04-29 12:28:00
categories: ["LeetCode"]
tags: ["Linkedlist"]
---

### 题目：Intersection of Two Linked lists

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

<!-- more -->

### 题意：

输入两个单链表，判断这两个单链表是否相交，返回相交点。这里有几种方法供大家参考。 本文中所有代码均为C++实现，其他语言代码稍后我会补上。

#### 解法1：
《编程之美》一书中有讲到该问题，如何判断这两个链表相交，可以讲其中一个链表的头尾相连，然后从另一个链表的角度来判断时候有环状链表存在即可。相当于将问题转换成如何求有环单链表的环状入口点？详细方案见我的另一篇专门讲环状单链表的文章 《关于有环单链表的那些事儿》。需要注意的是，不能改变原有链表的结构，因此方法返回的时候需要恢复原状。

　　1. 将链表B的尾节点指向其头节点HeadB，因此链表B形成环状，链表A成为有环单链表；
　　2. 此时问题转换成求链表A上环状入口点；
　　3. 恢复链表B的结构；

　　代码如下：

``` C++

    /**
		 *	 Definition for singly-linked list.
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

leetCode的OJ系统评判结果如下：
![leetCode C++ Solution1](http://7xilk1.com1.z0.glb.clouddn.com/leetCode002C++1.png)

#### 解法2：

　　《剑指Offer》一书中提到的这个方法，如果两个没有环的链表相交于某个节点，那么在这个节点之后的所有节点都是两个链表所共有的。因此两个链表从交织点之前的部分长度差即为整条链表的长度差，我们只要让两条链表从离交织点相同距离的位置开始前进，经过O（n）步，一定能够找到交织点。
　　
　　1. 遍历链表A，记录其长度len1，遍历链表B，记录其长度len2。
　　
　　2.  按尾部对齐，如果两个链表的长度不相同，让长度更长的那个链表从头节点先遍历abs(len1-en2),这样两个链表指针指向对齐的位置。

　　3. 然后两个链表齐头并进，当它们相等时，就是交集的节点。

　　时间复杂度O(n+m)，空间复杂度O(1)

　　代码如下：

``` C++

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

leetCode的OJ系统评判结果如下所示：
![leetCode C++ Solution 2](http://7xilk1.com1.z0.glb.clouddn.com/leetCode002C++2.png)

#### 解法3：
　还有一种解法，实际上还是利用步差来实现的，具体证明还米有搞懂，思考中。具体如下：

　　1. 维护两个指针pA和pB，初始分别指向链表A和链表B。然后让它们分别遍历整个链表，每步一个节点。

　　2. 当pA到达链表末尾时，让它指向B的头节点；类似的当pB到达链表末尾时，重新指向A的头节点。

　　3. 当pA和pB相遇时也即为交织点。

　　该算法的时间复杂度依然为O（m + n）,时间复杂度为O(1)。

实现如下：

``` C++

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


leetCode的OJ系统评判结果：
![leetCode C++  Solution3](http://7xilk1.com1.z0.glb.clouddn.com/leetCode002C++3.png)

