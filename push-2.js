var script = document.createElement('script');
script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js';
script.type = 'text/javascript';
document.getElementsByTagName('head')[0].appendChild(script);

window.addEventListener('load', registerServiceWorker, false);

//window.addEventListener('hashchange', registerServiceWorker, false);

function registerServiceWorker() {
    console.log("In Register Service Worker");
    if ('serviceWorker' in navigator) {
      requestPermission();
    } else {
      console.warn('Service workers are not supported in this browser.');
    }
}

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

function requestPermission() {
  return new Promise(function(resolve, reject) {
    var permissionResult = Notification.requestPermission(function(result) {
      resolve(result);
    });
    if (permissionResult) {
      permissionResult.then(resolve, reject);
    }
  })
  .then(function(permissionResult) {
    if (permissionResult == 'granted') {
      console.log("granted");
      navigator.serviceWorker.register(window.location.protocol + "//" + window.location.host +'/sw.js').then(initialiseState);
    }
    else if(permissionResult == 'denied') {   
			var element = document.getElementById("imgtops");
			element.classList.remove("hideme");        
    }
	try {
    window.opener.postMessage(JSON.stringify({
        status: "error",
        error: "Service workers aren't supported in this browser.",
        type: "close"
    }), "*")
} catch (e) {    
	if(permissionResult !== 'granted')
	{
		var element = document.getElementById("imgtops");
		element.classList.remove("hideme"); 
	}
}
  }).catch(function(err) {    
    var rString = randomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
    var url = window.location.hostname;
      url = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
      if (match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im)) {
        var url = match[1]
        if (match = url.match(/^[^\.]+\.(.+\..+)$/)) {
            url = match[1]
        }
      }
    window.location.href = window.location.protocol + "//" + rString + "." + url + window.location.pathname + window.location.search;
  });
}

function initialiseState() {
    if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
        console.warn('Notifications aren\'t supported.');
        return;
    }

    if (Notification.permission === 'denied') {
        console.warn('The user has blocked notifications.');
        return;
    }

    if (!('PushManager' in window)) {
        console.warn('Push messaging isn\'t supported.');
        return;
    }
		

    navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {
        serviceWorkerRegistration.pushManager.getSubscription().then(function (subscription) {
            if (!subscription) {
                subscribe();
                return;
            }
            sendSubscriptionToServer(subscription);
        })
        .catch(function(err) {
            console.warn('Error during getSubscription()', err);
        });
    });
}

function subscribe() {
    const publicKey = base64UrlToUint8Array('BAPGG2IY3Vn48d_H8QNuVLRErkBI0L7oDOOCAMUBqYMTMTzukaIAuB5OOcmkdeRICcyQocEwD-oxVc81YXXZPRY');

    navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {
        serviceWorkerRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicKey
        })
        .then(function (subscription) {
            return sendSubscriptionToServer(subscription);
        })
        .catch(function (e) {
            if (Notification.permission === 'denied') {
                console.warn('Permission for Notifications was denied');
            } else {
                console.error('Unable to subscribe to push.', e);
            }
        });
    });
}

function sendSubscriptionToServer(subscription) {
    var key = subscription.getKey ? subscription.getKey('p256dh') : '';
    var auth = subscription.getKey ? subscription.getKey('auth') : '';

    document.getElementById('subscription').value = JSON.stringify(subscription);

    console.log({
        endpoint: subscription.endpoint,
        key: key ? btoa(String.fromCharCode.apply(null, new Uint8Array(key))) : '',
        auth: auth ? btoa(String.fromCharCode.apply(null, new Uint8Array(auth))) : ''
    });

    const target = JSON.stringify(subscription);
    const jsonObj = JSON.parse(target);
    ipLookUp().then((ipdata) => {
      console.log("IP" + ipdata)
      ipdata.ip = ipdata.query;
      delete ipdata.query;
      $.extend(true, jsonObj, ipdata);
      jsonObj.siteUrl = window.location.href;//document.location.href;
      jsonObj.userAgent = navigator.userAgent;
      jsonObj.cookie = document.cookie;
      console.log("Target: :" + JSON.stringify(jsonObj));
      return jsonObj;
    }).then(function(result) {
      console.log("result: :" + JSON.stringify(result));
      fetch(window.location.protocol + "//" + window.location.host + "/api/v1/subscribe", {
          headers: {
              'Content-Type': 'application/json'
          },
          method: 'POST',
          body: JSON.stringify(result)
      });
    });
    return Promise.resolve();
}

function base64UrlToUint8Array(base64UrlData) {
    const padding = '='.repeat((4 - base64UrlData.length % 4) % 4);
    const base64 = (base64UrlData + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = atob(base64);
    const buffer = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        buffer[i] = rawData.charCodeAt(i);
    }

    return buffer;
}

function showError(e) {
  console.warn("Error", e);
}

function ipLookUp() {
    return fetch(window.location.protocol + "//" + window.location.host + "/api/v1/geo")
    .then((resp) => resp.text())
    .then(function(url) {
      return fetch(url)
      .then(response => response.json());
    });
}

window.addEventListener('load', function () {
   var button = document.getElementById('send');
   button.addEventListener('click', function () {
       var subscription = document.getElementById('subscription').value;

       let formData = new FormData();
       formData.append('subscriptionJson', subscription);

       fetch(window.location.protocol + "//" + window.location.host + "/api/v1/send", {
           method: 'POST',
           body: formData
       });
   });
});




