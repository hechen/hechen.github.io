---
title: 'In-app purchase'
slug: 'in-app-purchase'
date: 2018-05-24T10:40:39+00:00
draft: false
categories: ['ios', 'translation']
tags: ['carthage', 'category', 'cocoapods', 'iap', 'ios', 'notification', 'optional', 'push', 'receipt', 'swift', 'xcode']
---

If your app ships on the App Store, in-app purchase (IAP) is something you can't really avoid. Last year's spat between WeChat tipping and Apple put IAP in the spotlight again — and it isn't just a big-company concern. As an indie developer, IAP might be the thing putting food on the table.

On the client side, the whole IAP flow is built on top of `StoreKit`. Every payment-related operation goes through StoreKit.

![](https://i.imgur.com/EkBwhM4.png)

Let's start with a quick refresher on the overall flow.

## The IAP flow end-to-end

### Stage 1

![In-app purchase flow](http://7xilk1.com1.z0.glb.clouddn.com/2018-09-03-4DDE8387-EDB1-42CC-B18C-3DC6CA1DC688.png)

1.  Load the in-app identifiers.
2.  The client fetches localised product info from the App Store.
3.  Present the purchase UI; the user agrees and taps the buy button.
4.  The user authorises the purchase; the client sends a purchase request to the server.
5.  The server processes the request and returns the result to `StoreKit`.
6.  If the purchase passes validation, the client unlocks content or grants coins.
7.  The transaction is complete.

### Stage 2

When you zoom in on the Apple side of things, it looks like this:

![IAP With App Store](http://7xilk1.com1.z0.glb.clouddn.com/2018-08-27-intro_2x.png)

### Stage 3

If your own backend is in the loop, it looks roughly like this:

![IAP With Business Server](http://7xilk1.com1.z0.glb.clouddn.com/2018-08-29-1*MwLeHUGSupbb9j-oYQyflw.png)

The extra steps are:

1.  Fetch the list of product identifiers.
2.  The client uploads receipt data to the server. The server either validates it itself or calls Apple's verification endpoint.
3.  The server tells the client what was unlocked.

### Registering products

You register products through the iTunes Connect (now App Store Connect) backend. You need to know the product type up front.

#### Product types

There are four product types that can take part in IAP:

- Consumable products
- Non-consumable products
- Auto-renewable subscriptions
- Non-renewing subscriptions

For non-renewing subscriptions, the app developer is on the hook for syncing the entitlement across the user's devices.

Below are the key properties of each type, straight from Apple's docs:

| Product type | Non-consumable | Consumable | Auto-renewable | Non-renewing |
|----|----|----|----|----|
| Users can buy | Once | Multiple times | Multiple times | Multiple times |
| Appears in the receipt | Always | Once | Always | Always |
| Synced across devices | By the system | Not synced | By the system | By your app |
| Restored | By the system | Not restored | By the system | By your app |

A few things worth noting:

1.  Non-consumables can be bought once — a second purchase fails. The other three types (consumable, auto-renewing, non-renewing) can all be bought any number of times, and Apple won't complain.
2.  Consumables show up in the receipt once. The other three types stay in the receipt forever, which is critical for subscription validation later.

### Getting the product ID

The product ID is the one you filled in when registering the product on iTunes Connect.

![Product ID](http://7xilk1.com1.z0.glb.clouddn.com/2018-09-03-15359854946888.png)

Each in-app identifier uniquely identifies one sellable product. On the client you can hard-code them:

``` swift
let identifiers = ["com.myCompany.myApp.product1", "com.myCompany.myApp.product2" ]
```

Or pull them down from your server.

### Fetching product info

Once you have the product IDs, you use them to fetch full product details — price, description, and so on.

``` swift
// 获取一批商品的信息

let request = SKProductsRequest(productIdentifiers: identifierSet) 

request.delegate = self

request.start()
```

The result comes back in the delegate callback, where you display it or cache it.

``` swift
func productRequest(_ request: SKProductsRequest, didReceive response: SKProductsResponse) {

    for product in response.products {
    
    } 
} 
```

Apple's advice is not to cache: product info can change (a user switches App Store regions, prices shift with exchange rates, etc.). In China, though, the user-experience cost isn't the edge case — it's the fact that talking to Apple's servers is *slow*.

What we do is prefetch all product info on app launch and cache it. Next time the user opens the purchase sheet, we just show the cached info.

## Showing the purchase UI

Next you decide when to show the purchase sheet. The user picks something, and we move to the payment stage.

## Sending the purchase request

This part is dead simple — two lines. You wrap the product object in an `SKPayment` and add it to the payment queue:

``` swift
let payment = SKPayment(product: product) SKPaymentQueue.default().add(payment)
```

From here, it's Apple's show. The system pops up its own purchase dialog, and the user authorises with Touch ID/Face ID or a password.

## Handling the result

Once StoreKit and Apple's servers finish validating, you get a callback. Apple delivers it through `SKPaymentQueue`, so you need to register an observer *before* the payment happens:

``` swift
SKPaymentQueue.default().add(self)
```

You can put the observer logic in its own class. Implement the delegate methods:

``` swift
// 处理理 SKPaymentQueueObserver 事件
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

Every payment you submit produces a corresponding transaction. By inspecting `transaction.transactionState`, you can branch on each state. If the state is `.purchased`, you still want to validate against your own server — to make sure the transaction is real and not the work of some jailbreak plugin. What you actually validate is the **receipt** — think of it like the slip you get at the supermarket or restaurant. Every purchase has its own receipt, signed by Apple, stored locally on the client.

Apple supports two validation paths: on-device, and on your server.

![Receipt validation options](http://7xilk1.com1.z0.glb.clouddn.com/2018-09-03-E9DC4D03-7F18-49CC-B21D-835904E2B39F.png)

## Final: delivering the goods

Once your server has validated the receipt, the transaction is locally complete and you can hand the purchased content over to the user. From the business side, a successful purchase isn't necessarily a completed transaction — most teams add a business-side check before unlocking.

One thing to watch:

Apple is explicit about a few critical path points:

![Critical paths](http://7xilk1.com1.z0.glb.clouddn.com/2018-09-03-C1BB8495-728D-43E7-9C40-8EC9B3A22905.png)

Register your transaction observer as early as possible — right after the app finishes launching — so you have code in place across the entire lifecycle to handle whatever Apple sends you. If you register too late, Apple may notify you about an in-flight transaction from before, and you'll miss it. The point is that the user's purchase flow isn't tied to your app's lifecycle. Classic scenarios:

1.  The user force-quits the app.
2.  The user has to update their account's billing info (now they're out of your app).
3.  The app crashes.
4.  The user renews a subscription.
5.  The user enters an introductory-offer flow.
6.  The user leaves the app to enter a promo code.

## Finishing the transaction

On the way out, normal transactions just need to be finished. For abnormal transactions — errors and the like — you also need to wrap them up properly. Auto-renewing subscriptions go through this step too. If a transaction isn't finished, it sits in the queue forever — every callback will keep including it. That's why you have to listen early.

Finishing a transaction is one line:

``` swift
SKPaymentQueue.default().finishTransaction(transaction)
```

### Transaction vs. Receipt

A common confusion when working on IAP is the difference between transactions and receipts. Here's how I think about it.

#### About transactions

As you might have gathered from the payment section, a transaction corresponds to a specific payment — every payment produces one. But it's not strictly 1-to-1. Say you've already finished the transaction for a given payment; the user switches phones, signs in with the same Apple ID, and hits Restore. Apple will hand you a new transaction tied to the original payment, with state `.restored`.

The main transaction states:

| State        | Meaning                                                                            |
|:-------------|:-----------------------------------------------------------------------------------|
| .purchasing  | Nothing to do — keep waiting for the next state transition                          |
| .purchased   | User paid — process the post-purchase flow and call `finishTransaction`             |
| .failed      | Payment failed — handle the failure and call `finishTransaction`                    |
| .restored    | User paid (restored) — process the post-purchase flow and call `finishTransaction`  |
| .deferred    | Nothing to do — keep waiting for the next state transition                          |

**Note** on `finishTransaction`:

1.  For Apple-hosted downloads (e.g. paid content stored on iTunes Connect that downloads to the device), calling `finish` before the download completes will tear down the download and you won't be able to resume it.
2.  Transactions need to be paired with receipt validation to confirm they're legitimate. Pure client-side validation isn't trustworthy, so move it to your backend — and let the backend decide when to finish.
3.  The docs say: *Your app needs to finish every transaction, regardless of whether the transaction succeeded or failed.* So always finish — otherwise it stays in the payment queue. **But** transient states like `.purchasing` and `.deferred` should *not* be finished.

#### About receipts

The receipt is issued by the App Store. It's the record of your app and the purchases that have happened in it. It lives at a fixed path on the device. StoreKit doesn't generate it — it's a file pulled down from the App Store:

``` swift
guard let url = Bundle.main.appStoreReceiptURL else {
    // handle failure
    return
}

// read the contents
let receipt = Data(contentsOf: url)
```

If nothing's at that path, you can refresh — which is really just a request to the App Store for the receipt:

``` swift
let request = SKReceiptRefreshRequest()

request.delegate = self

request.start()
```

## A couple of gotchas

### Restoring purchased products

Watch out for this: if a user tries to buy something they've already purchased — instead of using your app's Restore button — the App Store still creates a brand-new transaction. The user isn't charged again, but the state isn't `.restored`, it's a fresh transaction. You can run it through the normal flow, but if you maintain your own account system, you need to detect this case and handle it yourself.

## References

1.  [In App Purchase](https://developer.apple.com/in-app-purchase/)
2.  [In-App Purchase Programming Guide](https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/StoreKitGuide/Introduction.html)
3.  [Receipt Validation Programming Guide](https://developer.apple.com/library/archive/releasenotes/General/ValidateAppStoreReceipt/Introduction.html)
4.  [How to detect refunded IAPs from receipts?](https://forums.developer.apple.com/thread/46737)
5.  [Check if a non-renewable subscription was refunded by Apple?](https://stackoverflow.com/questions/10771240/check-if-a-non-renewable-subscription-was-refunded-by-apple)
6.  [How does Apple notify iOS apps of refunds of in-app purchases (IAP)?](https://stackoverflow.com/questions/6439482/how-does-apple-notify-ios-apps-of-refunds-of-in-app-purchases-iap)
