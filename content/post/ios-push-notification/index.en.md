---
title: 'iOS remote push notifications: a deployment walkthrough'
slug: 'ios-push-notification'
date: 2015-07-30T14:30:00+00:00
draft: false
categories: ['c++', 'data-structure', 'ios', 'leetcode']
tags: ['array', 'c++11', 'ios', 'lambda', 'linked-list', 'linkedlist', 'notification', 'push', 'string']
---

iOS push notification setup has been driving me crazy for the past few days, so I'm writing up everything I learned for anyone else who might run into the same wall.

# How iOS remote push notifications work

APNs — short for Apple Push Notification service — is the heart of Apple's notification system. It's the server-side service Apple runs that delivers reliable, real-time push notifications to every iOS and OS X device. Each device that registers for push maintains a long-lived connection to APNs, which is how notifications can show up in real time. Notifications still come through even when the target app isn't running — the classic example being SMS-style alerts.

Every app has to register for push notifications with APNs. APNs returns a DeviceToken — a unique identifier for that device on APNs. The app then hands the DeviceToken back to its own server to be stored for later use, like this:

![DeviceToken flow](http://7xilk1.com1.z0.glb.clouddn.com/iosPushshare%20the%20device%20Token.png)

When your server needs to push a notification to a specific device, it sends the DeviceToken plus a payload in a fixed format (the Push payload) to APNs, and APNs delivers the notification to the device that DeviceToken belongs to. For a single push, the flow looks like this:

![Pushing a remote notification from a provider to a client app](http://7xilk1.com1.z0.glb.clouddn.com/iosPushPushing%20a%20remote%20notification%20from%20a%20provider%20to%20a%20client%20app.png)

For multi-provider pushes, APNs uses the DeviceToken we gave it earlier to route notifications correctly to each device:

![Pushing remote notifications from multiple providers to multiple devices](http://7xilk1.com1.z0.glb.clouddn.com/iosPushPushing%20remote%20notifications%20from%20multiple%20providers%20to%20multiple%20devices.png)

## Generating the local push certificate

Open Keychain Access on your Mac.

![Open Keychain Access](http://7xilk1.com1.z0.glb.clouddn.com/iosPush%e9%92%a5%e5%8c%99%e4%b8%b2.png)

A dialog will pop up asking for your user email.

![Generating the CSR](http://7xilk1.com1.z0.glb.clouddn.com/iosPush%e8%af%81%e4%b9%a61.png)

Enter your Apple developer account name (an email address). Choose "Saved to disk", click Continue, then Save. The file is named `CertificateSigningRequest.certSigningRequest`.

![Saving the generated CSR file](http://7xilk1.com1.z0.glb.clouddn.com/iosPush%e8%af%81%e4%b9%a62.png)

Now head to the [Apple Developer Center](developer.apple.com) and go to Member Center.

![Apple Developer Center](http://7xilk1.com1.z0.glb.clouddn.com/iosPush%e8%af%81%e4%b9%a63.png)

Click any item on the left to drill in:

![Developer home options](http://7xilk1.com1.z0.glb.clouddn.com/iosPush%e8%af%81%e4%b9%a64.png)

![Pick an item under iOS Apps](http://7xilk1.com1.z0.glb.clouddn.com/iosPush%e8%af%81%e4%b9%a65.png)

## App ID

First, register an identity for the app you're building — an App ID. Click the option on the left as shown:

![Add an App ID](http://7xilk1.com1.z0.glb.clouddn.com/iosPushAPPID1.png)

Click Add to go to the registration page. You need an App ID name and a BundleID. Important: the BundleID can't contain wildcards — wildcards aren't compatible with push. Down in App Services, check Push Notification.

![Filling out BundleID and App ID Description](http://7xilk1.com1.z0.glb.clouddn.com/iosPushAPPID2.png)

![Selecting App Services](http://7xilk1.com1.z0.glb.clouddn.com/iosPushAPPID3.png)

Click Continue, then confirm and submit. Notice that Push Notification will be shown as "Configurable" — that's because we haven't generated the push certificate yet for this App ID. We'll come back to check the App ID's state once the push certificate is ready.

![Confirming and submitting the App ID](http://7xilk1.com1.z0.glb.clouddn.com/iosPush%e8%af%81%e4%b9%a613.jpg)

## Certificates

Next, generate the developer certificate and the push certificate. As shown below, go to the Certificates section on the left, click Add, and continue to the next page:

![Add a certificate](http://7xilk1.com1.z0.glb.clouddn.com/iosPush%e8%af%81%e4%b9%a611.png)

If the option is greyed out, it means you already have a developer certificate and don't need to generate another one. If it's selectable, pick that option:

![Selecting the certificate type](http://7xilk1.com1.z0.glb.clouddn.com/iosPush%e8%af%81%e4%b9%a67.png)

On the next page, pick the App ID you registered earlier, then click Continue:

![Picking the App ID to bind the certificate to](http://7xilk1.com1.z0.glb.clouddn.com/iosPush%e8%af%81%e4%b9%a68.png)

Then choose the CSR file you saved locally (`CertificateSigningRequest.certSigningRequest`), click Generate, and you've created the developer certificate.

![Uploading the local CSR file](http://7xilk1.com1.z0.glb.clouddn.com/iosPush%e8%af%81%e4%b9%a69.png)

The process for the push test certificate is the same — the only difference is that on the certificate-type page you choose `Apple Push Notification service SSL`.

![Choosing the certificate type to generate](http://7xilk1.com1.z0.glb.clouddn.com/iosPush%e8%af%81%e4%b9%a610.png)

With the push certificate generated, head back to the App ID you created earlier and you'll see that Push Notifications is now Enabled. Once the distribution push certificate is also configured, Distribution will show as Enabled too.

![Checking the App ID status again](http://7xilk1.com1.z0.glb.clouddn.com/iosPush%e8%af%81%e4%b9%a612.jpg)

## Provisioning Profiles

Step three: generate a Provisioning Profile. The profile is basically a bundle that packages up the certificate, App ID, and device list. You generate different types of Provisioning Profiles for different scenarios, and they get embedded into the `.ipa` when you package the app.

Go to Provisioning Profiles > All on the left, click Add:

![Add a Provisioning Profile](http://7xilk1.com1.z0.glb.clouddn.com/iosPushProvision1.png)

Then pick the type. I'll use Development here as the example — there are two Distribution variants below it:

![Choose the Provisioning Profile type](http://7xilk1.com1.z0.glb.clouddn.com/iosPushProvision2.png)

Click Continue, then pick the push-enabled App ID we created earlier:

![Pick the App ID to bind](http://7xilk1.com1.z0.glb.clouddn.com/iosPushProvision3.png)

Next, pick the developer certificate we generated (this is one-to-one — if you're generating a Distribution profile, you'll see distribution certificates here instead):

![Pick the matching certificate](http://7xilk1.com1.z0.glb.clouddn.com/iosPushProvision4.png)

Then pick the authorized devices — the devices you're developing on. You can add devices in the Devices section on the left; you need each device's UUID. Here I'm picking all devices and clicking Continue:

![Pick authorized devices](http://7xilk1.com1.z0.glb.clouddn.com/iosPushProvision5.png)

Finally, give the Provisioning Profile a name:

![Name the Provisioning Profile](http://7xilk1.com1.z0.glb.clouddn.com/iosPushProvision6.png)

Click Generate and you have your Provisioning Profile.

By the same process, you can generate the Distribution developer certificate, push certificate, and matching Provisioning Profile. Drop all the final files into one folder, as shown — I generated both Distribution variants (Ad Hoc and Distribution) at the same time.

![All the generated certificates and Provisioning Profiles](http://7xilk1.com1.z0.glb.clouddn.com/iosPush%e8%af%81%e4%b9%a6200.png)

The `Push.p12` file is the one we'll come back to later.

## Setting up the dev environment

Install the `ios_development.cer` developer certificate and the `aps_development.cer` push certificate on the Mac where you generated the CSR — just double-click each one. Keychain Access will open. Find the private key generated alongside the CSR (it'll be named after the email you entered when generating the CSR), and select both the private key and the freshly installed push certificate. **Important: select both at once — you need to export the private key together with the installed push certificate as a single file.** Right-click and choose Export.

![Exporting the private key and the local push certificate](http://7xilk1.com1.z0.glb.clouddn.com/iosPushXCode6.png)

Name it Push and click Save:

![Save locally](http://7xilk1.com1.z0.glb.clouddn.com/iosPushXCode7.png)

You'll be asked to set a password on the certificate. This is the password your server side will need.

![Set the certificate password](http://7xilk1.com1.z0.glb.clouddn.com/iosPushXCode8.png)

Finally, configure the dev environment — meaning Xcode. Open Xcode > Preferences:

![Open Preferences](http://7xilk1.com1.z0.glb.clouddn.com/iosPushXCode1.png)

Under Accounts, add your developer account (it'll already be listed if you've signed in before). Click View Details:

![View account details](http://7xilk1.com1.z0.glb.clouddn.com/iosPushXCode5.png)

This pane shows the account's certificates and Provisioning Profiles. It should match what you see in the developer portal — if it doesn't, hit refresh:

![Refresh account info](http://7xilk1.com1.z0.glb.clouddn.com/iosPushXCode3.png)

After a moment, the Provisioning Profile we just created will show up. Then in Xcode under Build Settings -&gt; Code Signing, pick the Provisioning Profile you want.

![Pick the Provisioning Profile in Xcode](http://7xilk1.com1.z0.glb.clouddn.com/iosPushXCode4.png)

At this point the local dev environment is set up. Time to code. Code, code, code...

## Implementing remote push notifications in code

First, register for push notifications and get a DeviceToken:

``` objectivec
- (void)initPushNotificationWithApp: (UIApplication*)application {
    // Register for notifications
    if([UIDevice currentDevice].systemVersion.floatValue < 8.0) {
        [application registerForRemoteNotificationTypes:(UIRemoteNotificationTypeBadge
                                                       | UIRemoteNotificationTypeSound
                                                       | UIRemoteNotificationTypeAlert)];
    } else {
        // The registration API changed in iOS 8.0+
        UIUserNotificationSettings* settings = [UIUserNotificationSettings settingsForTypes:(UIRemoteNotificationTypeBadge
                                                                                           | UIRemoteNotificationTypeSound
                                                                                           | UIRemoteNotificationTypeAlert)
                                                                                 categories:nil];
        [application registerUserNotificationSettings:settings];
        [application registerForRemoteNotifications];
    }
}
```

If registration succeeds, APNs returns your device token, and iOS hands it to the app delegate:

``` objective
// If registration succeeds we get a DeviceToken — send it to the server to be stored
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
    PRINT_FUNC
    
    NSString* tokenStr = [NSString stringWithFormat:@"%@", deviceToken];
    NSLog(@"deviceToken: %@", tokenStr);
    if(tokenStr.length == 0)
    {
        NSLog(@"Device Token Invalid!");
    }
    
    // Hand the DeviceToken to our own server for storage
    [self sendDeviceToken:deviceToken]; 
}

// If registration fails we get an error with the reason
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
    PRINT_FUNC
    
    NSLog(@"***************************************\n");
    NSLog(@"Failed to Register The Notification!!!!\n");
    NSLog(@"error = %@", error);
    NSLog(@"***************************************\n");
}
```

Then in your AppDelegate, handle incoming pushes. When the user taps a notification from the notification center or the app is already running, the - (void)application:(UIApplication \*)application didReceiveRemoteNotification:(NSDictionary \*)userInfo delegate method fires:

``` objectivec
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo {
    PRINT_FUNC
    
    NSLog(@"Received push notification: %@", userInfo);
    
    // userInfo is a dictionary; the exact keys and values are agreed on between client and server
    NSString* orderId = [userInfo objectForKey:@"carryOrderId"];
    NSLog(@"Received order notification, orderId: %@", orderId);
    
    // ... do whatever you need with the info
}
```

There's also this one:

``` objectivec
/*! This delegate method offers an opportunity for applications with the "remote-notification" background mode to fetch appropriate new data in response to an incoming remote notification. You should call the fetchCompletionHandler as soon as you're finished performing that operation, so the system can accurately estimate its power and data cost.
 
 This method will be invoked even if the application was launched or resumed because of the remote notification. The respective delegate methods will be invoked first. Note that this behavior is in contrast to application:didReceiveRemoteNotification:, which is not called in those cases, and which will not be invoked if this method is implemented. !*/
 
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler; 
```

In practice both fire when the app is in the foreground or background — i.e., still alive — but the difference shows up when the app hasn't launched yet or has been killed in the background. In that case, tapping the notification launches the app, but only the second method fires; the first does not. The comment also tells you that this method will fire even when the app is suspended or fully closed in response to a remote notification, and that it takes precedence over the first one. The second method also lets you exchange data with the server — for example, if an order's status has changed, you can request the latest order info from your server inside this method.

The official docs describe both methods crisply:

``` text
// Tells the delegate that the running app received a remote notification.
    - application:didReceiveRemoteNotification:

// Tells the app that a remote notification arrived that indicates there is data to be fetched.
    - application:didReceiveRemoteNotification:fetchCompletionHandler:
```

------------------------------------------------------------------------

## The server side

Apple's APNs endpoints:

1.  Sandbox: `gateway.sandbox.push.apple.com:2195`
2.  Production: `gateway.push.apple.com:2195`

The simple notification format, sent as binary, network byte order:

![Simple Notification Format](http://7xilk1.com1.z0.glb.clouddn.com/iosPushSimple%20Notification%20Format.png)

You can implement the server side with raw sockets, but here I'm using the Javapns open-source library — it's easier, the payload format is already wrapped, and you just call `add`, `add`, `add`. The code uses the `Push.p12` we generated earlier:

``` java
package testApplePush;

import java.util.List;
import javapns.Push;
import javapns.notification.PushNotificationPayload;
import javapns.notification.PushedNotifications;

public class testApplePush 
{
    public static void main(String[] args)
    {
       try 
       {
          PushNotificationPayload payload = new PushNotificationPayload();

          payload.addAlert("This is a push notification!"); // body
          payload.addBadge(1); // badge number
          payload.addSound("default"); // sound
          
          // custom info
          payload.addCustomDictionary("carryOrderId", "121212121212121212121212");
 
            // DeviceToken stored on the server
          String deviceToken = "************************************************";
          PushedNotifications notifications = Push.payload(payload,     // the custom payload
                                                          "Push.p12",   // the certificate we generated
                                                          "111111111",  // the password set when exporting
                                                          false,        // send to production?
                                                          deviceToken); // the client's DeviceToken

            int numOfFailedNotifications = notifications.getFailedNotifications()
                    .size();
            int numOfSuccessfulNotificatios = notifications
                    .getSuccessfulNotifications().size();

            System.out.println(String.format(
                    "Successful Send: %d, Failed Send: %d",
                    numOfSuccessfulNotificatios, numOfFailedNotifications));

        } 
        catch (Exception e)
        {
            e.printStackTrace();
        }
    }
}
```

That sends a single push. Javapns doesn't seem to handle batch sending particularly well. The certificate used here is the `.p12` we exported earlier (**works on Windows too — some tutorials claim Windows doesn't recognize it, which isn't true**). Next, here's a PHP version for reference. It needs the `.p12` converted to `.pem` format. Here's how:

- Put the `aps_developement.cer` push certificate and the `Push.p12` in the same folder;
- In Terminal, `cd` into that folder, then convert `aps_developement.cer` to `.pem`. This produces `PushCert.pem`:

``` text
openssl x509 -in aps_development.cer -inform der -out PushCert.pem
```

- Next, convert `Push.p12` to `.pem`, producing `PushKey.pem`. It'll ask first for the original `Push.p12` password, then have you set a new password for the new file. The new password is what your server side will use:

``` text
openssl pkcs12 -nocerts -out Pushkey.pem -in Push.p12 
```

- Then concatenate the two `.pem` files into one — `Push.pem`:

``` text
cat PushCert.pem PushKey.pem > Push.pem
```

The whole flow looks like this:

![Generating the .pem files](http://7xilk1.com1.z0.glb.clouddn.com/iosPushXCode9.png)

With the certificate ready, here's the PHP push service. The code is simple — just be sure to use the `Push.pem` you just generated and the password you set during generation.

``` php
<?php
// DeviceToken (no spaces)
$deviceToken = '********************************************************';
// certificate password
$passphrase = '1111111111';
// notification body
$alert = 'This is a push notification!';

////////////////////////////////////////////////////////////////////////////////
$ctx = stream_context_create();
stream_context_set_option($ctx, 'ssl', 'local_cert', 'Push.pem');       // the .pem we made above
stream_context_set_option($ctx, 'ssl', 'passphrase', $passphrase);

// Open a connection to the APNS server
$fp = stream_socket_client(
        'ssl://gateway.sandbox.push.apple.com:2195',            // sandbox endpoint
        $err,                                                   
        $errstr, 
        60,                                                     // timeout
        STREAM_CLIENT_CONNECT|STREAM_CLIENT_PERSISTENT,
        $ctx);
if (!$fp)
    exit("Failed to connect: $err $errstr" . PHP_EOL);

echo 'Connected to APNS' . PHP_EOL;

// build the dictionary
$body['aps'] = array(
    'alert' => $alert,
    'sound' => 'default',
    'badge' => 66
    );

// turn it into JSON
$payload = json_encode($body);

// assemble the binary message — format per Apple's docs, also outlined above:
// Command + Token length + deviceToken + Payload length + payload
$msg = chr(0) . pack('n', 32) . pack('H*', $deviceToken) . pack('n', strlen($payload)) . $payload;

// ship it to APNs
$result = fwrite($fp, $msg, strlen($msg));
if (!$result)
    echo 'Fail to delivery Notification' . PHP_EOL;
else
    echo 'Delivery Notification successfully' . PHP_EOL;

fclose($fp);
?>
```

Test run:

![Final test result](http://7xilk1.com1.z0.glb.clouddn.com/iosPushResult.png)

### References

1.  [https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Introduction.html#//apple\_ref/doc/uid/TP40008194-CH1-SW1](https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Introduction.html#//apple_ref/doc/uid/TP40008194-CH1-SW1)
2.  [https://developer.apple.com/library/prerelease/ios/documentation/UIKit/Reference/UIApplicationDelegate\_Protocol/](https://developer.apple.com/library/prerelease/ios/documentation/UIKit/Reference/UIApplicationDelegate_Protocol/)
3.  [http://blog.csdn.net/shenjie12345678/article/details/41120637](http://blog.csdn.net/shenjie12345678/article/details/41120637)
