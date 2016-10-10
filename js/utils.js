"use strict";

function showPage() {
    chrome.tabs.query({
        url: [
            'https://webmail.pentalog.fr/*',
            'https://zimbra.pentalog.fr/*'
        ]
    }, function (tabs) {
        if (tabs.length > 0) {
            activateTab(tabs[0])
        } else {
            chrome.tabs.create({
                url: 'https://webmail.pentalog.fr/'
            }, function(tab){
                activateTab(tab)
            });
        }
    });
}

function activateTab(tab) {
    chrome.tabs.update(tab.id, {
        active: true
    });

    chrome.windows.update(
        tab.windowId,
        {focused: true}
    );
}

function compileQueryParts(folders) {
    let parts = [];

    if (folders != undefined) {
        $.each(folders, function(id, absPath){
            parts.push('in:"'+ absPath + '"');
        });
    }

    if (parts.length > 0) {
        return 'is:unread AND (' + parts.join(' OR ') + ')';
    } else {
        return 'is:unread';
    }
}

function getUTCNow() {
    let now = new Date();
    let time = now.getTime();
    let offset = 0 ;//now.getTimezoneOffset();
    offset = offset * 60000;
    return time - offset;
}

function utcToHourString(utc) {

    let d = new Date(utc);

    let mm = d.getMonth() + 1; // getMonth() is zero-based
    let dd = d.getDate();

    let h = d.getHours();
    let m = d.getMinutes();

    return [
            (h < 10) ? '0' + h : h,
            (m < 10) ? '0' + m : m
        ].join(':');
}

/**
 * Translates seconds into human readable format of seconds, minutes, hours, days, and years
 *
 * @param  {number} seconds The number of seconds to be processed
 * @return {string}         The phrase describing the the amount of time
 */
function microsecondsToDuration ( seconds ) {
    seconds = seconds / 1000;

    let levels = [
        [Math.floor(seconds / 31536000), 'years'],
        [Math.floor((seconds % 31536000) / 86400), 'days'],
        [Math.floor(((seconds % 31536000) % 86400) / 3600), 'hours'],
        [Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), 'minutes'],
        // [(((seconds % 31536000) % 86400) % 3600) % 60, 'seconds'],
    ];
    let returntext = '';

    for (let i = 0, max = levels.length; i < max; i++) {
        if ( levels[i][0] === 0 ) continue;
        returntext += ' ' + levels[i][0] + ' ' + (levels[i][0] === 1 ? levels[i][1].substr(0, levels[i][1].length-1): levels[i][1]);
    }
    return returntext.trim();
}


let evtTgt = function() {
    this.listeners = {};
};

evtTgt.prototype.listeners = null;
evtTgt.prototype.addEventListener = function(type, callback) {
    if(!(type in this.listeners)) {
        this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
};

evtTgt.prototype.removeEventListener = function(type, callback) {
    if(!(type in this.listeners)) {
        return;
    }
    let stack = this.listeners[type];
    for(let i = 0, l = stack.length; i < l; i++) {
        if(stack[i] === callback){
            stack.splice(i, 1);
            return this.removeEventListener(type, callback);
        }
    }
};

evtTgt.prototype.dispatchEvent = function(event) {
    if(!(event.type in this.listeners)) {
        return;
    }
    let stack = this.listeners[event.type];
    event.target = this;
    for(let i = 0, l = stack.length; i < l; i++) {
        stack[i].call(this, event);
    }
};
