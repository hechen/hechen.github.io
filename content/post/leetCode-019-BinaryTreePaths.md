---
title: "257. Binary Tree Paths"
date: 2015-08-18 16:28:26
categories: ["LeetCode"]
tags: ["Algorithm","Tree"]
---

#  题目：257. Binary Tree Paths

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

## 题意：

难度不大，考察树的遍历

## 解法：

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

