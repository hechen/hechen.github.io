---
title: "iOS 远端推送部署详解"
date: 2015-07-30 14:30:00
categories: ["iOS"]
tags: ["iOS","Push","Notification"]
---

最近几天被iOS的推送部署给搞懵了，现在特地整理下和大家进行分享。

#### iOS远端推送机制

APNS，全称为Apple Push Notification service，是苹果通知推送服务中最重要的一环。它是苹果通知推送服务器，为所有iOS设备以及OS X设备提供强大并且可靠的推送通知服务。每个注册通知服务的设备都会和该服务器进行长连接，从而实时获取推送通知。即使当前APP不在运行状态，当通知到达的时候也会有提示发生，最常见的就是短信服务。

<!-- more -->

每一个App必须向APNs注册通知服务，APNs会返回给设备一个DeviceToken，该Token为APNs上针对该设备的唯一标示符。App需要将该DeviceToken返给自身的Server端保存后续使用，如下所示。
![DeviceToken的操作流程](http://7xilk1.com1.z0.glb.clouddn.com/iosPushshare%20the%20device%20Token.png)

当App开发者的server需要向特定设备推送通知时，就使用DeviceToken和固定格式数据（Push payload）发给APNs，然后APNs就会向DeviceToken指定的设备推送通知了，具体流程如下所示，单一推送
![通知方推送一条远端通知给客户端代码的整个流程](http://7xilk1.com1.z0.glb.clouddn.com/iosPushPushing%20a%20remote%20notification%20from%20a%20provider%20to%20a%20client%20app.png)
或者多方通知，APNs都能一一对应，靠的就是之前我们提供给它的DeviceToken。
![多个通知方向向不同的客户端推送通知的流程示意](http://7xilk1.com1.z0.glb.clouddn.com/iosPushPushing%20remote%20notifications%20from%20multiple%20providers%20to%20multiple%20devices.png)


----------

#### 本地推送证书配置

打开你mac的钥匙串访问，然后点击钥匙串访问
![打开钥匙串](http://7xilk1.com1.z0.glb.clouddn.com/iosPush钥匙串.png)
随后它会弹出一个窗口 用户电子邮件信息
![生成CSR文件](http://7xilk1.com1.z0.glb.clouddn.com/iosPush证书1.png)
就填写你苹果开发者账号的名称即可（应该是一个邮件名称），点击保存到磁盘的选项，点击继续，点击存储，文件名为：CertificateSigningRequest.certSigningRequest。
![保存生成的CSR文件](http://7xilk1.com1.z0.glb.clouddn.com/iosPush证书2.png)

然后我们打开[苹果开发者中心](developer.apple.com)  进入Member Center
![苹果开发者中心](http://7xilk1.com1.z0.glb.clouddn.com/iosPush证书3.png)
然后点击左侧列表中任意一项进入详情页面，
![开发者个人首页选项](http://7xilk1.com1.z0.glb.clouddn.com/iosPush证书4.png)
![选择IOS Apps中列表项](http://7xilk1.com1.z0.glb.clouddn.com/iosPush证书5.png)

##### APP ID

首先我们需要为我们要开发的APP建立身份信息，就是AppID，如图所示，点击左侧
![添加AppID](http://7xilk1.com1.z0.glb.clouddn.com/iosPushAPPID1.png)
点击添加按钮进入注册页面，我们需要输入App Id的名字以及BundleID，其中BundleID不能有通配符，否则无法具备推送功能，然后在下面的APP Service中勾选Push Notification一项
![填写BundleID以及App ID Description](http://7xilk1.com1.z0.glb.clouddn.com/iosPushAPPID2.png)
![选择App Service](http://7xilk1.com1.z0.glb.clouddn.com/iosPushAPPID3.png)
点击下一步，然后确认提交即可，大家注意到Push Notification一项为Configurable，这是因为我们还没有为该AppID生成推送证书，等推送证书生成完毕之后可以再回来查看该AppID 的状态。
![确认提交App ID](http://7xilk1.com1.z0.glb.clouddn.com/iosPush证书13.jpg)

##### Certificates

其次，我们需要生成开发者证书和推送证书，如下图所示，点击左侧Cerifications列表，选择添加进入下一页面，
![添加证书](http://7xilk1.com1.z0.glb.clouddn.com/iosPush证书11.png)

如果您的页面如图所示为灰色不可选，说明您已经拥有了开发者证书。就不需要再次生成了，如果可选就选择该选项，
![选择证书类型](http://7xilk1.com1.z0.glb.clouddn.com/iosPush证书7.png)

接下来进入以下界面，选择你之前添加的AppID，之后点击Continue即可，
![选择需要绑定证书的App ID](http://7xilk1.com1.z0.glb.clouddn.com/iosPush证书8.png)

然后选择之前我们保存在本地的CSR文件CertificateSigningRequest.certSigningRequest，点击Generate就生成了开发者的证书。
![上传本机CSR文件](http://7xilk1.com1.z0.glb.clouddn.com/iosPush证书9.png)

同理我们需要生成推送测试证书，生成流程和开发者证书类似，只是在证书类型页面，选择的证书类型换成了Apple Push Notification service SSL。
![选择生成证书类型](http://7xilk1.com1.z0.glb.clouddn.com/iosPush证书10.png)

当我们生成好推送证书之后再回头看我们之前创建的AppId，能够看Push Notifications一项已经为Enabled了。当然发布推送证书配置完毕之后，Distribution一项也显示为Enable。
![再次查看APPID 状态](http://7xilk1.com1.z0.glb.clouddn.com/iosPush证书12.jpg)

##### Provisioning Profiles

第三步，需要生成Provisioning Profiles，该文件其实就是以上的证书、AppId以及设备信息的打包集合，我们只要在不同的场景下生成不同类型Provisioning Profiles即可，它会在后续打包ipa文件的时候被嵌入安装包内。
首先我们选择左侧列表中的Provisioning Profiles中的All选项，选择添加
![添加Provisioning Profiles文件](http://7xilk1.com1.z0.glb.clouddn.com/iosPushProvision1.png)

之后选择生成类型，我们这里以开发类型为例，下面还有发布的两种类型，
![选择生成PP文件类型](http://7xilk1.com1.z0.glb.clouddn.com/iosPushProvision2.png)

之后点击Continue，进入下一页面，同样选择我们之前创建的具有Push服务的AppId，
![选择绑定的App ID](http://7xilk1.com1.z0.glb.clouddn.com/iosPushProvision3.png)

接下来，选择上面生成的开发证书（一一对应的，如果你选择生成的是发布Provisioning Profiles，则会出现发布证书），
![选择之前生成的对应证书](http://7xilk1.com1.z0.glb.clouddn.com/iosPushProvision4.png)

紧接着，我们选择授权设备，即你需要进行开发的设备，该设备可以在左侧Devices列表中添加，需要提供设备的UUID，这里我们选择所有设备，点击Continue，
![选择授权设备](http://7xilk1.com1.z0.glb.clouddn.com/iosPushProvision5.png)

最后一步，我们给Provisioning Profiles添加名称，
![添加Provisioning Profiles名称](http://7xilk1.com1.z0.glb.clouddn.com/iosPushProvision6.png)
点击Generate即生成我们所需要的Provisioning Profile。

其实同理，我们可以生成发布版的开发者证书，推送证书以及对应的Provisioning Profiles。最后的文件我们都放到同一个文件夹里，如图所示，其中我把发布的两种（Ad Hoc 和 Distribution）都一起搞出来。
![生成的各个证书以及Provisioning Profile文件](http://7xilk1.com1.z0.glb.clouddn.com/iosPush证书200.png)

其中Push.p12文件后续会提及~

----------

#### 开发环境配置

我们将上一步生成的开发者证书`ios_development.cer`以及推送证书`aps_development.cer`在最初生成CSR文件的MAC机上安装，双击即可安装，同时会打开钥匙串页面，安装之后我们找到之前生成CSR文件时生成的专用密钥，名称就是我们之前生成CSR文件时填写的，选择该专用密钥，同时选中刚刚安装成功的推送证书，（**必须注意，同时选择，我们需要将专用密钥以及安装成功的推送证书同时导出成一个文件**）右键菜单导出，
![导出专用密钥和本地安装的推送证书](http://7xilk1.com1.z0.glb.clouddn.com/iosPushXCode6.png)
如图我们命名Push，点击存储，
![保存到本地](http://7xilk1.com1.z0.glb.clouddn.com/iosPushXCode7.png)
接下来需要为证书添加密码，这个密码是需要提供给服务器的。
![添加证书密码](http://7xilk1.com1.z0.glb.clouddn.com/iosPushXCode8.png)

最后我们需要配置我们本地的开发环境，也就是XCode，第一步我们点击XCode的Preference打开XCode的首选项菜单，
![打开Preference选项](http://7xilk1.com1.z0.glb.clouddn.com/iosPushXCode1.png)

在Account选项中添加我们的开发者账户，如果之前已经登录就会看到该账户信息，然后点击下方的View Details，
![查看账户信息](http://7xilk1.com1.z0.glb.clouddn.com/iosPushXCode5.png)

之后会显示该开发者账户的证书和Provisioning Profiles等信息，该信息会和你开发者账号里面显示的一致，如果不一致就点击刷新，
![刷新账户信息](http://7xilk1.com1.z0.glb.clouddn.com/iosPushXCode3.png)

不久就会出现我们之前创建的Provisioning Profiles，接下来，我们在XCode中Build Settings -> Code Signing中选择我们需要的Provisioning Profiles文件即可
![XCode选择对应的Provisioning Profile文件](http://7xilk1.com1.z0.glb.clouddn.com/iosPushXCode4.png)

此时本地开发环境已经配置完毕。接下来就开始Coding，Coding，Coding。。。。


#### 远端推送通知的代码实现

首先我们需要注册推送通知服务并获取DeviceToken；

``` Objc
- (void)initPushNotificationWithApp: (UIApplication*)application {
    // 注册通知服务
    if([UIDevice currentDevice].systemVersion.floatValue < 8.0) {
        [application registerForRemoteNotificationTypes:(UIRemoteNotificationTypeBadge
                                                       | UIRemoteNotificationTypeSound
                                                       | UIRemoteNotificationTypeAlert)];
    } else {
        // IOS8.0以上版本的注册推送方式和以往不同
        UIUserNotificationSettings* settings = [UIUserNotificationSettings settingsForTypes:(UIRemoteNotificationTypeBadge
                                                                                           | UIRemoteNotificationTypeSound
                                                                                           | UIRemoteNotificationTypeAlert)
                                                                                 categories:nil];
        [application registerUserNotificationSettings:settings];
        [application registerForRemoteNotifications];
    }
}
```




如果注册成功，APNs会返回给你设备的token，iOS系统会把它传递给app delegate代理：

``` Objective-C
// 如果注册成功，则会收到DeviceToken，我们需要将该Token发给服务器保存
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
    PRINT_FUNC
    
    NSString* tokenStr = [NSString stringWithFormat:@"%@", deviceToken];
    NSLog(@"deviceToken: %@", tokenStr);
    if(tokenStr.length == 0)
    {
        NSLog(@"Device Token Invalid!");
    }
	
	// 然后我们需要将该DeviceToken发给我们自己的服务器进行保存；
    [self sendDeviceToken:deviceToken]; 
}

// 如果注册失败，会收到错误信息，包含错误原因
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
    PRINT_FUNC
    
    NSLog(@"***************************************\n");
    NSLog(@"Failed to Register The Notification!!!!\n");
    NSLog(@"error = %@", error);
    NSLog(@"***************************************\n");
}
```

之后我们就可以在AppDelegate中添加处理代码，当用户点击通知栏的通知或者处于运行状态时，App代码会执行- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo代理方法，如下所示：

``` Objective-C
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo {
    PRINT_FUNC
    
    NSLog(@"收到推送通知: %@", userInfo);
    
    // userInfo是一个字典数据类型，具体Key Value由客户端和服务器进行协商确定
    NSString* orderId = [userInfo objectForKey:@"carryOrderId"];
    NSLog(@"收到订单消息通知，订单号：%@",orderId);
	
	// .... 其余逻辑，拿到具体关键信息之后进行下一步处理
}
```

还有一个方法 

``` Objective-C
/*! This delegate method offers an opportunity for applications with the "remote-notification" background mode to fetch appropriate new data in response to an incoming remote notification. You should call the fetchCompletionHandler as soon as you're finished performing that operation, so the system can accurately estimate its power and data cost.
 
 This method will be invoked even if the application was launched or resumed because of the remote notification. The respective delegate methods will be invoked first. Note that this behavior is in contrast to application:didReceiveRemoteNotification:, which is not called in those cases, and which will not be invoked if this method is implemented. !*/
 
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler; 
```

我发现这两个方法在APP处于后台或者前台展示，也就是App存活期会同样调用，但当APP并未启动或者被后台销毁之后，用户点击通知象虽然都会调起App，但是前者这个方法就不会被触发，而后者依然会被触发。注释中也说明了该方法即使在其中或者休眠状态下都会由于远端通知而被调用而且会优先于上一个方法。而且后者可以让你和服务器进行一定的数据交互，比如订单状态变化了，我们在该方法中向服务器请求最新的订单信息等等。

官方文档是这样描述这两个方法的，一目了然：

```
// Tells the delegate that the running app received a remote notification.
	- application:didReceiveRemoteNotification:

// Tells the app that a remote notification arrived that indicates there is data to be fetched.
	- application:didReceiveRemoteNotification:fetchCompletionHandler:
```

----------

####服务器端代码实现

Apple官方APNs地址：
1. 测试地址 gateway.sandbox.push.apple.com:2195
2. 正式发布地址 gateway.push.apple.com:2195

简单的通知数据格式，以二进制形式发送，网络字节序。
![简单的推送通知格式](http://7xilk1.com1.z0.glb.clouddn.com/iosPushSimple%20Notification%20Format.png)

服务器端代码也可以自己使用原生的Socket写，这里我使用Javapns这个开源代码实现，比较简单，Payload数据格式也已经被封装，你只需要add，add，add。代码如下：
其中就需要用到我们之前生成的Push.p12

``` Java
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

          payload.addAlert("这是一条推送通知!"); // 通知主体内容
          payload.addBadge(1); // 角标数字
          payload.addSound("default"); // 通知铃音
          
          // 加入自定义信息
          payload.addCustomDictionary("carryOrderId", "121212121212121212121212");
 
		    // 服务器端记录的DeviceToken
          String deviceToken = "************************************************";
          PushedNotifications notifications = Push.payload(payload, 	// 自定义payload
												          "Push.p12",	// 前面生成的证书
												          "111111111", 	// 证书导出时的密码
												          false,		// 是否发送到发布地址
												          deviceToken); // 客户端DeviceToken

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

当前这里只是发送一条，如果需要批量发送，貌似Javapns支持的不是太好。这里使用的证书就是上面我们导出的.p12格式证书（**Windows平台使用没问题。有些教程说是Win系统不识别是不正确的**），接下来还有一份PHP写的代码，供大家查阅。但是这其中需要将我们的p12格式证书转换成pem格式证书。具体教程如下：
-  将我们之前生成的推送证书aps_developement.cer文件以及Push.p12文件放在同一文件夹下；
-  在Terminal中切换到该目录下，然后执行命令将aps_developement.cer文件转换成pem格式文件，之后会在本目录下生成PushCert.pem文件

```
openssl x509 -in aps_development.cer -inform der -out PushCert.pem
```
- 紧接着执行命令将Push.p12文件转换成pem格式文件，之后在本目录下生成PushKey.pem文件，其中会提示你先输入之前生成Push.p12文件的时候的密码，然后需要为新生成的证书文件添加密码，这个密码是要提供给服务端使用的；

```
openssl pkcs12 -nocerts -out Pushkey.pem -in Push.p12 
```
- 然后将这两个pem文件合成成一个pem文件，Push.pem
```
cat PushCert.pem PushKey.pem > Push.pem
```
整个过程如下图所示：
![pem文件生成过程](http://7xilk1.com1.z0.glb.clouddn.com/iosPushXCode9.png)

证书生成完毕之后，我们就可以在代码中使用了。
如下为PHP写的推送通知服务。代码很简单，主要是注意其中证书为上一步生成的Push.pem，密码就是生成时输入的密码。

``` PHP
<?php
// DeviceToken 不包含空格
$deviceToken = '********************************************************';
// 证书密码
$passphrase = '1111111111';
// 通知主体内容
$alert = '这是一条推送通知!';

////////////////////////////////////////////////////////////////////////////////
$ctx = stream_context_create();
stream_context_set_option($ctx, 'ssl', 'local_cert', 'Push.pem');		// ck.pem证书上有提及
stream_context_set_option($ctx, 'ssl', 'passphrase', $passphrase);

// Open a connection to the APNS server
$fp = stream_socket_client(
		'ssl://gateway.sandbox.push.apple.com:2195', 			// 远端测试地址
		$err,													
		$errstr, 
		60, 													// 超时时间
		STREAM_CLIENT_CONNECT|STREAM_CLIENT_PERSISTENT,
		$ctx);
if (!$fp)
	exit("Failed to connect: $err $errstr" . PHP_EOL);

echo 'Connected to APNS' . PHP_EOL;

// 建立字典数据
$body['aps'] = array(
	'alert' => $alert,
	'sound' => 'default',
	'badge' => 66
	);

// 将字典数据转换成JSON
$payload = json_encode($body);

// 组织二进制数据格式，具体格式参照apple官方文档，本文中也有提及。
// Command + Token length + deviceToken + Payload length + payload
$msg = chr(0) . pack('n', 32) . pack('H*', $deviceToken) . pack('n', strlen($payload)) . $payload;

// 发送组成的数据给APNs
$result = fwrite($fp, $msg, strlen($msg));
if (!$result)
	echo 'Fail to delivery Notification' . PHP_EOL;
else
	echo 'Delivery Notification successfully' . PHP_EOL;

fclose($fp);
?>
```
运行下下测试：
![最终测试效果](http://7xilk1.com1.z0.glb.clouddn.com/iosPushResult.png)


参考：
[1]. https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Introduction.html#//apple_ref/doc/uid/TP40008194-CH1-SW1
[2]. https://developer.apple.com/library/prerelease/ios/documentation/UIKit/Reference/UIApplicationDelegate_Protocol/
[3]. http://blog.csdn.net/shenjie12345678/article/details/41120637


