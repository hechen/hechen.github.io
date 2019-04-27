---
title: "解析 PNChart 第三方库"
date: 2017-02-12 16:36:54
draft: true
categories: ["SourceCode"]
tags: ["iOS","Github","Objective-C"]
---

### 学习 PNChart 

本篇文章写作时，**PChart** 版本号为 `0.8.9`.

<!-- more -->

#### 代码结构

##### 可视化展示类型

首先，目前 PNChart 提供多达六种图的可视化展示。分别是：

1. PNLineChart
![PNLineChart-w621](http://7xilk1.com1.z0.glb.clouddn.com/PNLineChart.png)

2. PNScatterChart
![PNScatterChart-w621](http://7xilk1.com1.z0.glb.clouddn.com/PNScatterChart.png)

3. PNRadarChart
![PNRadarChart](http://7xilk1.com1.z0.glb.clouddn.com/PNRadarChart.png)

4. PNPieChart
![PNPieChart](http://7xilk1.com1.z0.glb.clouddn.com/PNPieChart.png)

5. PNBarChart
![PNBarChart](http://7xilk1.com1.z0.glb.clouddn.com/PNBarChart.png)


6. PNCircleChart
![PNCircleChart](http://7xilk1.com1.z0.glb.clouddn.com/PNCircleChart.png)

##### 类图

首先来看最主要的集中图片的类，如下所示：
![](http://7xilk1.com1.z0.glb.clouddn.com/14867986596626.jpg)

其中除了 `PNCircleChart` 以外，其余均继承了 `PNGenericChart`类。 

其中图片和外界的交互回调是通过 PNChartDelegate 来进行的，要包含这么多种类型图片的回调，接口自然无法写的更加优雅，看这个协议定义的方法就能看出来。
![](http://7xilk1.com1.z0.glb.clouddn.com/14867993267852.jpg)


同时，针对每一种图形类别，也有相对应的 Model 类型，如下所示：
![](http://7xilk1.com1.z0.glb.clouddn.com/14868010321036.jpg)

目前设计来看并不是很统一，其中和外界进行对接的数据类型定义为 `PNxxChartData`，而该具体的每一个节点数据类型就用`PNxxChartDataItem` 类型来标识，因为具体的图形化业务不同，并不是所有的`PNChart`都会使用者两者，比如 `PNBarChart` 目前就完全不使用类似的设计，而是直接指定Y轴的值，还有`PNCircleChart`也如此，只需指定 Total 和 current 即可。

还有剩余几个辅助类：
![](http://7xilk1.com1.z0.glb.clouddn.com/14868112330724.jpg)

1. PNColor 类只有一个方法：` imageFromColor: ` ，生成某种颜色的图片，而在其所定义的文件 PNColor.h 中定义了很多常用颜色的宏；
2. PNLineChartColorRange 类型是定义在 PNLineChartData.h 文件中一个类型，主要是指定折线图上，命中指定的数值区域时显示特定的颜色；如下所示代码，当 Y 轴元素是 10 ~ 30 之间，显示红色折线，当 Y 轴元素是 100 ~ 200 之间，显示紫色折线。

``` Objective-C

 PNLineChartData *data01 = [PNLineChartData new];
 data01.rangeColors = @[
    [[PNLineChartColorRange alloc] initWithRange:NSMakeRange(10, 30) color:[UIColor redColor]],
    [[PNLineChartColorRange alloc] initWithRange:NSMakeRange(100, 200) color:[UIColor purpleColor]]
        ];
```

3. PNChartLabel类定义 UILabel，库中所用到的 Label 均为该类型，主要是做了一些通用的配置罢了。




