/**
 * Service worker file.
 *
 * NOTE: This file MUST be located in the root.
 */

'use strict';

console.log('Started', self);

self.addEventListener('install', function (event) {
    self.skipWaiting();
    console.log('Installed', event);
});

self.addEventListener('activate', function (event) {
    console.log('Activated', event);
});

self.addEventListener('push', function (event) {
    console.log('Push message', event);

    var data = {};
    var title;
    var body;
    var icon;
    var tag;
    var badge;
    var renotify;
    var image;
    if (event.data) {
        data = event.data.json();
    }
    console.log('Push data: ' + JSON.stringify(data));

    //if (isJson(data)) {
        title = data.title;
        body = data.message;
        icon = data.icon;
        tag = data.tag;
        image = data.image;
        renotify = data.renotify;
        badge = data.badge;
    //}

   self.clickTarget = data.clickTarget;
   event.waitUntil(
   self.registration.showNotification(title, {
					              body: body,
					              icon: icon,
					              image: image,
					              tag: tag,
	                                              badge: badge,
					              renotify: renotify
					            })
			        );
});


self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Notification click Received.');

    event.notification.close();

    if(clients.openWindow){
        event.waitUntil(clients.openWindow(self.clickTarget));
    }
});



var isJson = function (str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
