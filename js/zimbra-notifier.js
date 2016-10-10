class Appointment {

    constructor (uid, name, location, alarmAt) {
        this.uid = uid;
        this.name = name;
        this.location = location;
        this.alarmAt= parseInt(alarmAt);
    }
}

let ZimbraNotifierService = {

    /**
     * @returns {Deferred}
     */
    authenticate: function () {

        let promise = new $.Deferred();
        chrome.storage.local.get('token', (items) => {
            if (items.token == undefined) {
                promise.reject();
            } else {
                promise.resolve(items.token);
            }
        });

        return promise;
    },

    /**
     * @returns {Deferred}
     */
    loadSettings: function () {
        let promise = new $.Deferred();
        chrome.storage.sync.get(['folders','interval','mailEnabled', 'calendarEnabled'], (items) => {
            promise.resolve({
                folders: items.folders || {},
                interval: ((items.interval || 1) * 60* 1000),
                mailEnabled: (items.mailEnabled || 1) == 1,
                calendarEnabled: (items.calendarEnabled || 1) == 1
            });
        });

        return promise;
    },

    /**
     *
     * @param token
     * @param folders
     * @returns {Deferred}
     */
    searchForUnreadMessages: function (token, folders) {
        let promise = new $.Deferred();

        SOAP.search(token, compileQueryParts(folders), (response) => {
            let messages = [];

            $(response).find('SearchResponse > c').each(function (index, conversation) {

                let $conv = $(conversation);
                messages.push({
                    title: $conv.find('> su').text(),
                    message: $conv.find('> fr').text()
                })
            });

            promise.resolve(messages);
        });

        return promise;
    },

    searchForAppointments: function (token) {
        let promise = new $.Deferred();

        SOAP.getAppointments(token)
            .then((result) => {
                let appointments = [];

                $(result).find('appt[alarm=1]').each((index, appointment) => {
                    let $appointment = $(appointment);
                    let nextAlarm = parseInt($appointment.find('alarmData').attr('nextAlarm'));

                    if (nextAlarm < getUTCNow()) {
                        return;
                    }

                    console.log(nextAlarm, nextAlarm > getUTCNow(), new Date(nextAlarm));

                    // console.log(appointment, nextAlarm > getUTCNow());
                    // if (nextAlarm > getUTCNow()) {
                        appointments.push(new Appointment(
                            $appointment.attr('uid'),
                            $appointment.attr('name'),
                            $appointment.attr('loc'),
                            nextAlarm
                        ));
                    // }
                });

                promise.resolve(appointments);
            });

        return promise;
    },
    getAppointment: function (token, uid) {
        let promise = new $.Deferred();

        SOAP.getAppointments(token)
            .then((result) => {
                let $appointment = $(result).find('appt[uid="' + uid + '"]');

                if ($appointment.length == 0) {
                    return;
                }

                let name = $appointment.attr('name');
                let organizer = $appointment.find('or').attr('d');
                let instanceStart = parseInt($appointment.find('alarmData').attr('alarmInstStart'));
                let duration = parseInt($appointment.attr('dur'));
                let end = instanceStart + duration;


                let location = $appointment.attr('loc');
                let m = location.match(/"\s\<(.*)\@/);
                if (m) {
                    location = m.pop();
                }

                promise.resolve({
                    name: name,
                    location: location,
                    organizer: organizer,
                    start: parseInt(instanceStart),
                    end: parseInt(end),
                    duration: duration,
                });
            });

        return promise;
    }
};
