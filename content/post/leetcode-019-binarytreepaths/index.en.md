---
title: '[257] Binary Tree Paths'
slug: 'leetcode-019-binarytreepaths'
date: 2015-08-18T16:28:26+00:00
draft: false
categories: ['ios', 'leetcode']
tags: ['algorithm', 'array', 'ios', 'linkedlist', 'notification', 'push', 'string', 'tree']
---

# Problem: 257. Binary Tree Paths

Given a binary tree, return all root-to-leaf paths.
For example, given the following binary tree:
1
/  
2 3  
5
All root-to-leaf paths are:
\["1-&gt;2-&gt;5", "1-&gt;3"\]

## Read

Not hard — a straightforward tree traversal.

## Solution

C++ version:

``` c
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
