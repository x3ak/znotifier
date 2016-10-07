const NEW_MAIL_ID = 'new-mail';

chrome.notifications.onClicked.addListener(function (notificationId) {
    showPage();
    chrome.notifications.clear(notificationId);
});

chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {

    if (notificationId == NEW_MAIL_ID) {
        if (buttonIndex == 0) {
            chrome.notifications.clear(notificationId);
        }
    }

});

// handle storage changes that might happen in the options
chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (let key in changes) {
        let storageChange = changes[key];

        if (namespace == 'sync') {
            if (key == 'folders') {
                zimbra.folders = storageChange.newValue;
                console.info('Folders changed to: ', zimbra.folders);
            } else if (key == 'interval') {

            }
        } else if (namespace == 'local' && key == 'token') {
            zimbra.token = storageChange.newValue;
            console.info('Token changed to: ', zimbra.token);
        }
    }
});

function showNotification(unreadMessages) {

    let suffix = (unreadMessages.length > 1) ? ' (' + unreadMessages.length + ')' : '';

    chrome.notifications.create(NEW_MAIL_ID, {
        type: 'list',
        iconUrl: 'icon-128.png',
        title: 'New message!' + suffix,
        requireInteraction: true,
        isClickable: true,
        items: unreadMessages,
        message: 'message',
        buttons: [
            {title: 'Dismiss', iconUrl: 'action-cancel.png'}
        ]
    });

}

// main app logic
let interval = null;
$.when(
    ZimbraNotifier.authenticate(),
    ZimbraNotifier.loadSettings()
).then(function(token, settings){
    console.groupCollapsed('Initialization finished');
    console.info('Using persisted token: ', token);
    console.info('Loaded settings: ', settings);
    console.groupEnd();

    interval = setInterval(function() {
        $.when(ZimbraNotifier.searchForUnreadMessages(token, settings.folders))
            .then((messages) => {
                if (messages.length > 0) {
                    console.info('Found unread messages:', messages);
                    showNotification(messages);
                } else {
                    console.info('No unread messages has been found:');
                }
            });
    }, settings.interval);
}).fail(() => {
    console.warn('Initialization failed!');
    chrome.runtime.openOptionsPage();
});
