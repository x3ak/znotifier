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



