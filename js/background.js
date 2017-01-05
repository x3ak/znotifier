"use strict";

let globalToken = null;

const NEW_MAIL_ID = 'new-mail';
const APPOINTMENT_ID = 'appt-alert';

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
                if (['folders','mailEnabled','calendarEnabled'].indexOf(key) != -1) {
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

chrome.alarms.onAlarm.addListener((alarm) => {
    ZimbraNotifierService
        .getAppointment(globalToken, alarm.name)
        .then(showAppointmentNotification);
});

function searchForUnreadMessages(token, folders) {
    ZimbraNotifierService
        .searchForUnreadMessages(token, folders)
        .then(showNotification);
}

function showNotification(unreadMessages) {

    if (unreadMessages.length > 0) {
        console.info('Found unread messages:', unreadMessages);

        let suffix = (unreadMessages.length > 1) ? ' (' + unreadMessages.length + ')' : '';

        chrome.notifications.create(NEW_MAIL_ID, {
            type: 'list',
            iconUrl: 'images/mail-128.png',
            title: 'New message!' + suffix,
            requireInteraction: true,
            isClickable: true,
            items: unreadMessages,
            message: 'message',
            buttons: [
                {title: 'Dismiss', iconUrl: 'images/action-cancel.png'}
            ]
        });

    } else {
        chrome.notifications.clear(NEW_MAIL_ID);
        console.info('No unread messages has been found:');
    }
}

function showAppointmentNotification(appointment) {

    let startsIn = microsecondsToDuration(appointment.start - getUTCNow());

    let time = microsecondsToDuration(appointment.duration) + ' until ' + utcToHourString(appointment.end);

    let location = appointment.location.length > 0 ? appointment.location : '';

    let message = 'In ' + startsIn + "\n" + time ;


    chrome.notifications.create(APPOINTMENT_ID, {
        type: 'basic',
        iconUrl: 'images/calendar-128.png',
        title: appointment.name,
        requireInteraction: true,
        isClickable: true,
        message: message,
        contextMessage: location
    });
}

// main app logic
let mailInterval = null;
let apptInterval = null;

function start() {
    console.info('Starting background task.');

    $.when(
        ZimbraNotifierService.authenticate(),
        ZimbraNotifierService.loadSettings()
    ).then(function(token, settings){
        console.groupCollapsed('Initialization finished');
        console.info('Using persisted token: ', token);
        console.info('Loaded settings: ', settings);
        console.groupEnd();

        globalToken = token;

        if (settings.mailEnabled) {
            mailInterval = setInterval(function () {
                searchForUnreadMessages(token, settings.folders);
            }, settings.interval);
        }

        if (settings.calendarEnabled) {
            apptInterval = setInterval(function () {
                scheduleAlarms(token);
            }, settings.interval);
        }

    }).fail((e) => {
        console.warn('Initialization failed!', e);
        chrome.runtime.openOptionsPage();
    });



}

function scheduleAlarms(token) {
    ZimbraNotifierService.searchForAppointments(token)
        .then((appointments) => {
            console.info('Found appointments:', appointments);

            chrome.alarms.getAll((alarms) => {
                console.info('Already set alarms:', alarms);

                // setting / updating alarms for found appointments
                appointments.forEach((appointment) => {
                    // searching for alarm with same name as appointment uid
                    let alarm = alarms.find((alarm) => {
                        return alarm.name == appointment.uid ? alarm : undefined;
                    });

                    // if no alarm was found or already set alarm has wrong scheduled time, create / update it
                    if (
                        alarm == undefined ||
                        (alarm != undefined && alarm.scheduledTime != appointment.alarmAt)
                    ) {
                        console.info('[Re]setting alarm: ', appointment.uid);
                        chrome.alarms.create(appointment.uid, {
                            when: appointment.alarmAt
                        });
                    }
                });

                // clearing existing alarms without appointment
                alarms.forEach((alarm) => {
                    let index = appointments.find((appointment) => {
                        return appointment.uid == alarm.name ? appointment : undefined
                    });

                    if (index == undefined) {
                        console.info('Clearing dangling alarm:', alarm.name);
                        chrome.alarms.clear(alarm.name);
                    }
                });

            });
        });
}

function restart() {
    console.info('Restarting background tasks.');

    clearInterval(mailInterval);
    clearInterval(apptInterval);

    start();
}

start();

