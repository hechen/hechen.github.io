---
title: In App Purchase
date: 2018-05-24 10:40:39
categories: ["iOS"]
tags: ["iOS","IAP","Receipt"]
---


对于在 App Store 中上架的应⽤来说，应⽤内购买(In-App Purchase，简称 IAP) 应该是一个避不开的话题，尤其是去年微信打赏和 Apple 之间的争执更让 IAP 火了一把，不仅仅大公司，作为个人开发者来讲，IAP 也是非常重要的，说不定就是你养家糊口的工具呢。

<!-- more -->

整个 IAP 的过程，在客户端的实现依赖于 `StoreKit` 这个框架，所有的支付相关操作都是交由 StoreKit 来完成的。

首先，我们先复习一下 IAP 的整个流程。

## In App Purchase 的整体流程

### 阶段 1

![In App Purchase 过程](http://7xilk1.com1.z0.glb.clouddn.com/2018-09-03-4DDE8387-EDB1-42CC-B18C-3DC6CA1DC688.png)

1. 加载 In-App Identifier
2. 客户端从 AppStore 中获取本地化的商品信息。
3. 把 IAP 的购买界⾯面展示给⽤用户，⽤用户可以同意购买并点击购买按钮。
4. ⽤用户授权购买，客户端向服务器器发送购买请求。
5. 服务器器处理理购买请求，并把结果返回给 StoreKit。
6. 如果购买请求验证通过，客户端此时解锁内容或者提供⾦金金币。
7. 至此，整个交易易流程结束。

### 阶段 2

具体到和 Apple Store 打交道的话，如下所示：

![IAP With App Store](http://7xilk1.com1.z0.glb.clouddn.com/2018-08-27-intro_2x.png)

### 阶段 3

如果涉及到自己 App 端 Server 的参与，基本如下图所示：

![IAP With Business Server](http://7xilk1.com1.z0.glb.clouddn.com/2018-08-29-1*MwLeHUGSupbb9j-oYQyflw.png)

正常多出的几步：

1. 获取 Product 标识列表；
2. 客户端上传 Receipt 数据给 Server，Server 自行校验或者使用 Apple 的接口校验；
3. Server 端告知给客户端付费内容


### 注册商品

商品注册是通过 iTunes Connect 后台进行的，其中商品类型需要提前明确好。

#### 商品类型

参与 App 内支付动作的商品有四种类型：

- Consumable products （消耗型商品）
- Non-consumable products （非消耗型商品）
- Auto-renewable subscriptions （自动续约订阅）
- Non-renewable subscriptions （非自动续约订阅）

其中关于非自动续约订阅，App 的开发者有义务同步服务到用户的所有设备上。

如下，是官方文档列出来的四种商品类型的一些主要属性。

| Product type | Non-consumable | Consumable | Auto-renewable | Non-renewing
| --- | --- | --- | --- | --- | 
| Users can buy | Once | Multiple times | Multiple times | Multiple times |
| Appears in the receipt | Always | Once | Always | Always | 
| Synced across devices | By the system | Not synced | By the system | By your app |
| Restored | By the system | Not restored |  By the system | By your app |

其中需要注意的几点：

1. 除了非消耗型商品只能买一次，再次购买应该会失败以外，其他三种类型（消耗型，连续/非连续订阅）都是可以无限制购买的，Apple 是不会报错的；
2. 除了消耗型商品在 Receipt 中出现一次，其他三种类型（非消耗型，连续/非连续订阅）是始终都会在其中的，这也是后续做订阅校验至关重要的一环；

### 获取 Product ID

这里获取的是 Product 在 iTunes Connect 后台注册商品时填写的 Product ID

![Product ID](http://7xilk1.com1.z0.glb.clouddn.com/2018-09-03-15359854946888.png)

In-App Identifier 为每个可销售的商品提供一个唯一标识。在客户端上，我们可以直接写死代码:

``` Swift
let identifiers = ["com.myCompany.myApp.product1", "com.myCompany.myApp.product2" ]
```

或者从 Server 端获取。

### 获取商品信息

然后通过上一步取得的 Product ID 来获取具体某个 Product 的详细信息，包括价格，描述等等。

``` Swift
// 获取一批商品的信息

let request = SKProductsRequest(productIdentifiers: identifierSet) 

request.delegate = self

request.start()
```

在代理回调中处理获取的结果，进行展示或者 Cache。

``` Swift
func productRequest(_ request: SKProductsRequest, didReceive response: SKProductsResponse) {

    for product in response.products {
    
    } 
} 
```

官方建议是不要进行缓存，因为 Product 的信息有可能会更新，比如用户切换 AppStore 的区域，价格信息也会因为相应的汇率发生变化。不过！在国内，被牺牲最大的用户体验不是这种边界情况，而是获取 Product 信息是需要和 Apple Server 打交道的，这就有个问题 —— 慢！

我们会在开机的时候提前预取所有 Product 信息，并且缓存起来。下次弹出充值面板的时候就直接列出商品信息即可。


## 展示支付 UI

接下来就看什么时候进行购买了，展示商品面板进行购买。用户在面板上进行选择之后，就进入了下一阶段 ── 支付

## 发出购买请求

这⼀步也很简单， 两⾏行代码就可以搞定。只需要把之前拿到的商品对象传到 `SKPayment` 的初始化方法中，构造一个 `SKPayment` 实例，再把这个实例加⼊到购买队列中即可:

``` Swift
let payment = SKPayment(product: product) SKPaymentQueue.default().add(payment)
```

之后就交给 Apple 了，此时应用内会弹出苹果设计的购买窗口，用户只要使⽤指纹或者输入密码即可同意付款。


## 处理购买结果

当⽤户的购买请求经过 `StoreKit` 和苹果服务器的验证后，开发者可以在回调函数中接收到。Apple 具体的回调会通过 `SKPaymentQueue` 来进行，如下，我们需要在支付之前就向 `SKPaymentQueue` 中加入代理监听。

``` Swift
SKPaymentQueue.default().add(self)
```

你可以把具体的监听放在一个独立的类中完成。在该 Observer 中，实现代理方法：

``` Swift
// 处理理 SKPaymentQueueObserver 事件
// MARK: - SKPaymentTransactionObserver
func paymentQueue(_ queue: SKPaymentQueue, updatedTransactions transactions:[SK PaymentTransaction]) {
    for transaction in transactions {
        switch transaction.transactionState { 
            case .purchased:
            // Validate the purchase
            
            // Locate the file
            guard let url = Bundle.main.appStoreReceiptURL else {
                // Handle failure
                return    
            }

            // Read the contents
            let receipt = Data(contentsOf: url)
        } 
    }
} 
```

对于每一个你提交的 Payment，就一定会有一个相应的 Transaction 生成以便其后续处理。通过检查 transaction 的状态，我们可以指定每种状态下的处理逻辑。如果状态显示已购买， 我们还是应该和⾃己的服务器器进行一次校验，确保交易真实有效⽽而不是通过越狱后的某些插件完成的。被检验的，是一种被苹果称之为收据(receipt)的凭证，就像我们在超市购物或者饭店就餐后拿到的收据一样，每⼀个购买的商品都有⾃己的收据。这个收据由苹果签发，保存在客户端本地。

目前 Apple 官方提供两种方式，一种是本机校验，一种是 Server 端校验。

![Receipt Validation Ways](http://7xilk1.com1.z0.glb.clouddn.com/2018-09-03-E9DC4D03-7F18-49CC-B21D-835904E2B39F.png)


## Final，投递商品

当 Server 端检验完成之后，说明本地交易已经成功完成，因此将用户购买的内容提供给用户使用。当然，对于业务方，购买完成不代表业务完成，因此大多数情况下还有一步进行商品业务校验的过程。

需要注意的一点是：

Apple 也明确告诉开发者有几个关键的路径节点需要注意：

![关键路径](http://7xilk1.com1.z0.glb.clouddn.com/2018-09-03-C1BB8495-728D-43E7-9C40-8EC9B3A22905.png)

监听交易状态的代码一定要越早越好，比如在 App 完成启动之后进行注册，确保整个生命周期内都有代码逻辑来处理监听到的交易，根据监听到的 Transaction 的状态来分发处理逻辑。因为很有可能你监听的时机太晚，导致 Apple 通知有一些之前未完成的交易的时候你无法捕获。说白了就是用户的购买流程跟 App 生命周期不挂钩导致的，典型的有以下几个场景

1. 用户杀死了 App
2. 用户需要更新帐号中的付费信息（此时已跳出 App ）
3. App 闪退
4. 用户进行了订阅续期
5. 用户进入了推介促销价的流程
6. 用户跳出 App 输入推广码

## 结束交易

在最后一步中，如果是正常的交易，那么简单的结束它们就⾏了。但对于其他异常的交易易，⽐比如出现了一些 error，也要妥善的结束它们。如果是⾃动续期的订阅，也会经过这一步。如果 交易没有被正确的结束，它们会一直停留留在上文提到的队列中，每次回调函数被调用时，队列 中都会有这些没有被结束的交易。也就是为什么需要提前监听的原因了。

结束交易的代码⾮常简单，只有一行:

``` Swift
SKPaymentQueue.default().finishTransaction(transaction)
```

### 关于 Transaction 和 Receipt 的区别和联系

很多同学在进行 IAP 开发的时候常常有一个很大的困惑就是 Transaction 和 Receipt 傻傻分不清楚，这里重新梳理了一下。

#### 关于 Transaction

其实前面讲 Payment 的操作的时候已经表明了， Transaction 是和具体的一次 Payment 对应的，也就是发生一次 Payment 就会生成 Transaction，但是，并不是 1 对 1 的关系，比如本次 Payment 对应的 Transaction 已经被 finish 了，用户换了手机，登陆同样 AppleID 的时候使用 Restore 功能，Apple 会生成 Transaction 给你，本次的 Transaction 就对应的之前的 Payment，只是状态标记为 .restored。

Transaction 的状态主要有以下这么几种：

| 状态 | 含义 |
|:--|:--|
| .purchasing | 不需要做什么，继续等待 SKPaymentTransactionState 的状态流转 |
| .purchased | 用户已完成付费，处理付费后的流程并调用 finishTransaction 方法 |
| .failed | 用户付费失败，处理付费失败的流程并调用 finishTransaction 方法 |
| .restored | 用户付费成功，处理付费后的流程并调用 finishTransaction 方法 |
| .deferred | 不需要做什么，继续等待 SKPaymentTransactionState 的状态流转 |


**Note**: 对于 `finishTransaction` 的几点说明：

1. 对于那些依赖苹果下载服务的，比如存储在 iTunes Connect 上的付费内容要下载到本地，如果下载完成之前就进行了 finish 动作会导致 Apple 阻断所有的下载流程，并且无法重新下载；
2. Transaction 需要配合 Receipt 验证是否合法，单纯靠前端是不靠谱的，因此交由业务后端验证 Receipt 更安全合理，业务后端来决定是否需要 finish
3. 文档里说：Your app needs to finish every transaction, regardless of whether the transaction succeeded or failed. 所以我们需要将 Transaction Finish 掉，否则会始终出现在 PaymentQueue 里，BUT，中间态的交易是不需要 finish 的，比如 .purchasing 和 .deferred


#### 关于 Receipt

Receipt 是 App Store 签发的，是你的 App 上和该 App 上发生的支付行为记录。它存储在设备上的某个固定地址，StoreKit 并不会生成它，它是从 App Store 拉取下来的一个文件。如图所示：

``` Swift

guard let url = Bundle.main.appStoreReceiptURL else {
    // handle failure
    return
}

// read the contents
let receipt = Data(contentsOf: url)
```

如果本地该地址里没有，我们还可以进行刷新，实质上就是从 App Store 请求 Receipt 数据。请求如下：

``` Swift
let request = SKReceiptRefreshRequest()

request.delegate = self

request.start()
```


## 这里有几个需要注意的点：

### 恢复已经购买的商品

这里有一个需要注意的事情就是：如果一个用户试图去购买一个之前购买过的商品，而不是使用你App 提供的 Restore 功能恢复的话，App Store 会依然创建一个正常的新交易。用户是不会被再次收费的，这里的问题是，Transaction 的状态可不是 restored，而是完全新的 Transaction，你可以按照之前的正常流程走，当然对于自带账户体系的 App 来讲，需要自行判断和计算。


## 参考资料：

1. [In App Purchase](https://developer.apple.com/in-app-purchase/)
2. [In-App Purchase Programming Guide](https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/StoreKitGuide/Introduction.html)
3. [Receipt Validation Programming Guide](https://developer.apple.com/library/archive/releasenotes/General/ValidateAppStoreReceipt/Introduction.html)
4. [How to detect refunded IAPs from receipts?](https://forums.developer.apple.com/thread/46737)
5. [Check if a non-renewable subscription was refunded by Apple?](https://stackoverflow.com/questions/10771240/check-if-a-non-renewable-subscription-was-refunded-by-apple)
6. [How does Apple notify iOS apps of refunds of in-app purchases (IAP)?](https://stackoverflow.com/questions/6439482/how-does-apple-notify-ios-apps-of-refunds-of-in-app-purchases-iap)