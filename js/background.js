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
    let shouldRestart = false;

    for (let key in changes) {
        switch (namespace) {
            case 'sync':
                if (['folders'].indexOf(key) != -1) {
                    shouldRestart = true;
                }
                break;
            case 'local':
                if (['token', 'account', 'interval'].indexOf(key) != -1) {
                    shouldRestart = true;
                }
                break;
        }
    }

    if (shouldRestart) {
        restart();
    }
});

function showNotification(unreadMessages) {

    let suffix = (unreadMessages.length > 1) ? ' (' + unreadMessages.length + ')' : '';

    chrome.notifications.create(NEW_MAIL_ID, {
        type: 'list',
        iconUrl: 'images/icon-128.png',
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

function start() {
    console.info('Starting background task.');

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

}

function restart() {
    console.info('Restarting background task.');

    clearInterval(interval);
    start();
}

start();
