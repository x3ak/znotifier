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

function microsecondsToDuration(m) {
    return (m / 1000).toString() + ' sec'
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
