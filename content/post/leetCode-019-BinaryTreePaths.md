---
title: "leetCode[019]BinaryTreePaths"
date: 2015-08-18 16:28:26
categories: ["LeetCode"]
tags: ["Algorithm","String"]
---

### 题目：
  Given a binary tree, return all root-to-leaf paths.
    For example, given the following binary tree:
						   1
						 /   \
					    2     3
							   \
							    5
	All root-to-leaf paths are:
			["1->2->5", "1->3"]
			
<!-- more -->

### 题意：
难度不大，考察树的遍历

### 解法：
C++版本实现方法：
		
``` C++

	/**
		 * Definition for a binary tree node.
		 * struct TreeNode {
		 *     int val;
		 *     TreeNode *left;
		 *     TreeNode *right;
		 *     TreeNode(int x) : val(x), left(NULL), right(NULL) {}
		 * };
		 */
	class Solution {
		public:
			vector<string> binaryTreePaths(TreeNode* root) 
			{
				vector<string> results;
				visitTreeNode(root, "", results);
				return results;
			}

		private:
			void visitTreeNode(TreeNode* node, string path, vector<string>& result)
			{
			    if(node == nullptr) return;
				if (!path.empty())
				{
					path += "->";
				}
				path += int2Str(node->val);

				if (node->left == nullptr && node->right == nullptr)
				{
					result.push_back(path);
				}
				else
				{
					if (node->left != nullptr)
					{
						visitTreeNode(node->left, path, result);
					}
					if (node->right != nullptr)
					{
						visitTreeNode(node->right, path, result);
					}
				}
			}

			std::string int2Str(int nValue)
			{
				ostringstream ss;
				ss << nValue;
				return ss.str();
			}
		}
```

leetCode Oj系统评判结果如下图所示：
没有各种语言的柱状图，官方解释由于没有充足的提交导致，不知道是新题还是因为太简单大家直接略过了~

![leetCode Binary Tree Paths C++](http://7xilk1.com1.z0.glb.clouddn.com/leetCode019C++.png);


