---
title: Probability of getting 'k' heads with 'n' coins
date: 2019-03-11T15:19:49+08:00
draft: true
tags: ["Coin","Probability","DP","Dynamic Programming"]
categories: ["Interview"]
---

Given 𝑛 biased coins, with each coin giving heads with probability 𝑃𝑖, find the probability that on tossing the 𝑛 coins you will obtain exactly 𝑘 heads. You have to write the formula for this (i.e. the expression that would give 𝑃(𝑛,𝑘)).



其解法是经典的 DP 问题，其递推公式如下：


You can use Dynamic Programming as 𝑁th turn's outcome is mutually independent to 𝑁−1th and there are two possible cases here :

𝐾 heads already came in 𝑁−1 turns
𝐾−1 heads already came in 𝑁−1 turns
𝑑𝑝[𝑖][𝑗] : probability of getting 𝑗 heads in 𝑖 trials.

So, 𝑑𝑝[𝑛][𝑘]=𝑑𝑝[𝑛−1][𝑘]⋅(1−𝑃[𝑛])+𝑑𝑝[𝑛−1][𝑘−1]⋅𝑝[𝑛]



还有一道题目，






[Probability of getting 'k' heads with 'n' coins](https://math.stackexchange.com/questions/429698/probability-of-getting-k-heads-with-n-coins)