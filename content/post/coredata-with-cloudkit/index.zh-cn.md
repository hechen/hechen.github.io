---
title: 'Core Data with CloudKit'
slug: 'coredata-with-cloudkit'
date: 2020-11-27T16:59:37+08:00
lastmod: 2026-09-07T16:00:00-07:00
draft: false
description: 'Notes on sharing a Core Data store with an extension, syncing it through CloudKit, and keeping the UI up to date.'
categories: ['coredata', 'macos']
tags: ['core-data', 'cloudkit', 'icloud', 'app-extensions']
---

*Updated September 7, 2026, after reviewing Apple’s current documentation. Originally published in November 2020.*

I first worked through this setup while building Sideloader, an app with an action extension. The extension needed to save data that the app could read, and I wanted that data to reach my other devices through iCloud. The SQLite store lived in an App Group container.

The original post spent most of its space on the persistence stack. Looking back, the missing details were more useful than the boilerplate: which process should sync, how another context notices a change, and what happens while a device is offline. Those are the parts I’ve expanded here.

## A save finishes on the device

With `NSPersistentCloudKitContainer`, a fetch reads the local store. A save on a store-backed context writes to that store and records changes in persistent history. The container later exports those changes to CloudKit and imports changes from other devices when the system schedules the work. Apple describes the sequence in [TN3163](https://developer.apple.com/documentation/technotes/tn3163-understanding-the-synchronization-of-nspersistentcloudkitcontainer).

That distinction matters in the UI. After `context.save()` succeeds, “Saved” is a reasonable message. “Synced to your other devices” would promise something the save hasn’t established. The receiving device still has to import the change and update its view.

The same applies to startup. A loaded store is ready for local use; it may still be waiting for its first import. An empty fetch on a newly installed device doesn’t tell you whether the person has data in iCloud.

This article uses the private database for one person’s devices. Sharing records with another person needs additional store and sharing configuration.

## Let the app handle sync

An App Group gives the app and extension access to the same local files. It doesn’t configure CloudKit. The app still needs the iCloud capability with its CloudKit container selected, Push Notifications, and, on iOS, the Remote notifications background mode. Both targets need access to the same App Group. Apple’s [setup guide](https://developer.apple.com/documentation/coredata/setting-up-core-data-with-cloudkit) covers the CloudKit capabilities.

There is also a correction to the original design. Apple warns that two `NSPersistentCloudKitContainer` instances trying to sync the same store can conflict, including an app and extension running in separate processes. [TN3164](https://developer.apple.com/documentation/technotes/tn3164-debugging-the-synchronization-of-nspersistentcloudkitcontainer#Avoid-synchronizing-a-store-with-multiple-persistent-containers) suggests putting the app in charge of synchronization.

For this setup, I’d use `NSPersistentCloudKitContainer` in the app and a plain `NSPersistentContainer` in the extension. Both open the same SQLite store with the same model. The extension saves locally; the app handles the CloudKit work when it runs. That means an extension save can succeed while its upload remains pending.

Here is a small version of that setup. The model is named `Sideloader` and must be available to both targets. Replace the example identifiers at the call sites with your own. The async wrapper requires iOS 15 or macOS 12 or later.

```swift
import CoreData
import CloudKit

private enum StoreError: Error {
    case appGroupUnavailable(String)
}

@MainActor
func openStore(
    appGroupID: String,
    cloudContainerID: String?
) async throws -> NSPersistentContainer {
    guard let directory = FileManager.default.containerURL(
        forSecurityApplicationGroupIdentifier: appGroupID
    ) else {
        throw StoreError.appGroupUnavailable(appGroupID)
    }

    let container: NSPersistentContainer
    if cloudContainerID != nil {
        container = NSPersistentCloudKitContainer(name: "Sideloader")
    } else {
        container = NSPersistentContainer(name: "Sideloader")
    }

    let description = NSPersistentStoreDescription(
        url: directory.appendingPathComponent("Sideloader.sqlite")
    )
    description.shouldAddStoreAsynchronously = true
    description.setOption(
        true as NSNumber,
        forKey: NSPersistentHistoryTrackingKey
    )
    description.setOption(
        true as NSNumber,
        forKey: NSPersistentStoreRemoteChangeNotificationPostOptionKey
    )

    if let cloudContainerID {
        let options = NSPersistentCloudKitContainerOptions(
            containerIdentifier: cloudContainerID
        )
        options.databaseScope = .private
        description.cloudKitContainerOptions = options
    }

    container.persistentStoreDescriptions = [description]

    // This wrapper loads one store. The callback runs once per store.
    try await withCheckedThrowingContinuation {
        (continuation: CheckedContinuation<Void, Error>) in
        container.loadPersistentStores { _, error in
            if let error {
                continuation.resume(throwing: error)
            } else {
                continuation.resume()
            }
        }
    }

    container.viewContext.automaticallyMergesChangesFromParent = true
    container.viewContext.mergePolicy =
        NSMergePolicy(merge: .mergeByPropertyObjectTrumpMergePolicyType)
    return container
}
```

The app passes a CloudKit identifier:

```swift
let container = try await openStore(
    appGroupID: "group.com.example.sideloader",
    cloudContainerID: "iCloud.com.example.sideloader"
)
```

The extension passes `nil`:

```swift
let container = try await openStore(
    appGroupID: "group.com.example.sideloader",
    cloudContainerID: nil
)
```

Call this once during startup in each process, retain the result, and handle the thrown error before presenting screens that need the store. The example deliberately leaves the app’s error UI and history consumer out. It also assumes a single store; a multi-store loader must wait for every completion callback.

The merge policy above favors in-memory property values during a local Core Data merge conflict. Choose it to match the editing behavior you want. It doesn’t define a complete conflict policy for edits arriving from other devices.

## Check the model before adding CloudKit

A model that works locally may need changes before it can sync. In the model editor, mark persisted attributes optional or give them a default value, and check these restrictions:

- Relationships must be optional and have inverses. Related records can arrive at different times.
- Unique constraints and the Deny delete rule aren’t supported.
- Relationships can’t cross model configurations.

Apple lists the model restrictions in [Creating a Core Data Model for CloudKit](https://developer.apple.com/documentation/coredata/creating-a-core-data-model-for-cloudkit). For a saved item and its tags, for example, the UI needs to tolerate the item arriving before all its tags. A required relationship in the product doesn’t necessarily translate to a required relationship in the storage model.

For an existing app, keep the store URL stable. Changing the filename or directory can leave you looking at a new, empty database. Enabling CloudKit doesn’t require moving the SQLite file into an iCloud Drive folder.

If making the model compatible changes its schema, version the model and test an upgrade from a populated old store. [Lightweight migration](https://developer.apple.com/documentation/coredata/migrating-your-data-model-automatically) handles supported model changes, but that is a separate job from uploading records. Opening the upgraded store successfully verifies only the local part. Test the initial export and a second device’s import too.

## Get store changes into the view

`automaticallyMergesChangesFromParent` helps a context incorporate saves from its parent or persistent store coordinator. I keep it enabled for the app’s ordinary UI. It is not, by itself, the full solution for another process writing the shared store.

For the app and extension, use persistent history. The two store options in the example enable history tracking and remote-change notifications in both processes. A `.NSPersistentStoreRemoteChange` notification is a reason to inspect the store’s history; it doesn’t mean every device is up to date.

Each consumer needs its own saved history token. Fetch transactions after that token on a background context, merge the relevant transactions into the view context on its queue, then persist the token after processing succeeds. Also check history at startup or when returning to the foreground, so work done while the process was absent is picked up.

Apple’s [history guide](https://developer.apple.com/documentation/coredata/consuming-relevant-store-changes) shows the fetch and merge APIs. Don’t copy its history-purge example without deciding how long *all* your consumers need those transactions, including CloudKit. Losing a consumer’s unprocessed history needs a recovery path.

## Pinning is a choice for a particular screen

The original post ended by recommending `try? viewContext.setQueryGenerationFrom(.current)`. That was too broad, and hiding a failure with `try?` made the example worse.

A query generation gives a context a consistent snapshot of a SQLite store. It is useful for a screen that should remain stable while background work changes the database. It doesn’t prevent another device from deleting an object or decide what an editor should do with that deletion.

For a list that should update as changes arrive, I would start with merging and a UI that handles inserts and deletions. For an isolated editing session, pin a dedicated context and decide when the session should advance. Catch pinning errors. After changing its generation, refresh registered objects or fetch again; changing the generation alone doesn’t refresh them.

Also, saving, merging, and resetting can advance a context’s generation. Pinning a context while automatically merging into it doesn’t give you a permanently frozen view. Apple documents these details in [Accessing data when the store changes](https://developer.apple.com/documentation/coredata/accessing-data-when-the-store-changes).

## Before shipping, test the production schema

Initialize and inspect the CloudKit development schema using a development-only tool or test. `initializeCloudKitSchema(options:)` belongs there, after the stores are loaded, rather than in the normal launch path of a released app.

Deploy that schema to production before testing the release through TestFlight. If a debug build syncs and the TestFlight build doesn’t, a missing production schema is one of the first things to check. Apple calls this out in [TN3164](https://developer.apple.com/documentation/technotes/tn3164-debugging-the-synchronization-of-nspersistentcloudkitcontainer#Mirror-your-Core-Data-model-to-CloudKit).

Production schema changes need planning. You can add record types and fields; you can’t treat existing ones as disposable. A local model migration doesn’t deploy the corresponding server schema.

For testing, I’d start with two devices using the same iCloud account: create, edit, and delete on each; repeat with one device offline; then save from the extension while the app is closed. Finally, open the app and check that the other device receives the extension’s change. Repeat the important paths with a TestFlight build.

## When a change doesn’t arrive

First establish where it stopped: the source store, CloudKit, the destination store, or the destination UI. That is more useful than repeatedly reinstalling the app.

`NSPersistentCloudKitContainer.eventChangedNotification` reports setup, import, and export activity. Its [event object](https://developer.apple.com/documentation/coredata/nspersistentcloudkitcontainer/event) includes an error, start and end dates, and a success flag. Check that an event has ended before treating it as a completed operation. A successful export still says nothing about whether the other device has imported it.

For a reproducible delay, record timestamps on both devices and follow [TN3163’s sysdiagnose workflow](https://developer.apple.com/documentation/technotes/tn3163-understanding-the-synchronization-of-nspersistentcloudkitcontainer). The system can defer sync, and repeatedly saving the same data to provoke an upload can make throttling worse.

I would keep the local save path usable while investigating sync. Someone saving a link in an extension should be able to find it in the app even without a network connection.

## References

Apple documentation reviewed September 7, 2026:

1. [Setting Up Core Data with CloudKit](https://developer.apple.com/documentation/coredata/setting-up-core-data-with-cloudkit) — capabilities, containers, and store configuration.
2. [Creating a Core Data Model for CloudKit](https://developer.apple.com/documentation/coredata/creating-a-core-data-model-for-cloudkit) — model restrictions and development-to-production schema changes.
3. [Loading persistent stores](https://developer.apple.com/documentation/coredata/nspersistentcontainer/loadpersistentstores(completionhandler:)) — when the stack is ready and how completion callbacks work.
4. [Migrating your data model automatically](https://developer.apple.com/documentation/coredata/migrating-your-data-model-automatically) — supported lightweight migrations.
5. [Automatically merging context changes](https://developer.apple.com/documentation/coredata/nsmanagedobjectcontext/automaticallymergeschangesfromparent) and [Consuming relevant store changes](https://developer.apple.com/documentation/coredata/consuming-relevant-store-changes) — context updates and persistent history.
6. [Accessing data when the store changes](https://developer.apple.com/documentation/coredata/accessing-data-when-the-store-changes) — query generations, advancing snapshots, and refreshing objects.
7. [NSPersistentCloudKitContainer.Event](https://developer.apple.com/documentation/coredata/nspersistentcloudkitcontainer/event) — observing sync activity.
8. [TN3163: Understanding the synchronization of NSPersistentCloudKitContainer](https://developer.apple.com/documentation/technotes/tn3163-understanding-the-synchronization-of-nspersistentcloudkitcontainer) — tracing exports and imports.
9. [TN3164: Debugging the synchronization of NSPersistentCloudKitContainer](https://developer.apple.com/documentation/technotes/tn3164-debugging-the-synchronization-of-nspersistentcloudkitcontainer) — configuration failures, app/extension conflicts, and throttling.
