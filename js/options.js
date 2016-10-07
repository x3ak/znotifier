let authToken = null;

let Router = {
    controllers: {
        authentication: function (promise) {
            chrome.storage.local.get(['token', 'account'], (items) => {
                promise.resolve({account: items.account || ''});
            });
        },
        index: function (promise) {

            chrome.storage.local.get(['account', 'interval'], (items) => {
                chrome.storage.sync.get(['folders'], (syncItems) => {
                    let $foldersListRO = $('#folders-list-readonly').html('');

                    $.each((syncItems.folders || {}), (folderId, absPath) => {
                        $foldersListRO.append('<li>' + absPath + '</li>');
                    });

                    promise.resolve({
                        account: items.account || '',
                        interval: items.interval || 1
                    });
                });
            });
        },
        folders: function (promise) {
            SOAP.getFolderRequest(authToken, function (response) {

                let foldersSubscribed = [];

                chrome.storage.sync.get(['folders'], (items) => {

                    if (items.folders != undefined) {
                        $.each(items.folders, function (folderId) {
                            foldersSubscribed.push(folderId);
                        });
                    }

                    let $foldersList = $('#folders-list').html('');
                    let folders = [];

                    $(response).find('folder[absFolderPath="/"] folder[view=message]').each((index, folder) => {

                        let absPath = $(folder).attr('absFolderPath');
                        let folderId = $(folder).attr('id');

                        let row = $('<label />')
                            .append('<input type=checkbox ' +
                                'name="' + folderId + '" ' +
                                'value="' + absPath + '"' +
                                (foldersSubscribed.indexOf(folderId) > -1 ? 'checked="checked"' : '') +
                                '> ')
                            .append('<span>' + absPath + '</span>');

                        $foldersList.append($('<div class="settings-row" />').append(row));
                    });

                    promise.resolve();
                });



            });
        },
        logout: function (promise) {
            chrome.storage.local.clear(function () {
                Router.showPage('authentication');
            });
        }
    },
    showPage: function (identifier) {
        $('.options-page.active').removeClass('active');

        let promise = new $.Deferred();
        if (this.controllers[identifier] == undefined) {
            console.error("No controller defined for: ", identifier);
        }

        this.controllers[identifier](promise);

        promise.then((parameters) => {

            let $section = $('#' + identifier + '-page');

            $.each(parameters, (name, value) => {
                $section.find('[model="' + name + '"]').text(value)
            });

            $section.addClass('active');
            console.info('Switched to the new section: ', identifier);
        });

    }
};

chrome.storage.local.get(['token', 'account'], function (items) {

    if (items.token == undefined) {
        Router.showPage('authentication');
    } else {
        authToken = items.token;
        Router.showPage('index');
    }
});


$(document).on('submit', 'form#folders-form', function(e){
    e.preventDefault();

    let folders = {};
    $(this).serializeArray().forEach(function (item) {
        folders[item.name] = item.value;
    });

    chrome.storage.sync.set({folders: folders}, () => {
        console.info('Saved to the storage:', folders);
        Router.showPage('index');
    });
});

$(document).on('submit', 'form#authentication-form', function (e) {
    e.preventDefault();

    let account = $(this).find('[name=account]').val();
    let password = $(this).find('[name=password]').val();

    chrome.storage.local.set({ account: account });

    SOAP.authRequest(account, password, (response) => {
        let token = $(response).find('authToken').text();
        chrome.storage.local.set({
            token: token
        }, function () {
            console.info('Authenticated with token:', token);
            authToken = token;

            Router.showPage('index');
        });
    }, () => {
        $('#authentication-error').show();
        Router.showPage('authentication');
    });
});

$(document).on('click', '[is=section-link]', function (e) {
    e.preventDefault();
    Router.showPage($(this).attr('section'));
});

//
// $(document).ready(function(){
//     let link = document.querySelector('#auth-template');
//     let template = link.import.querySelector('template');
//     let style = link.import.querySelector('style');
//
//     // loading template
//     document.querySelector('body').appendChild(
//         document.importNode(template.content, true)
//     );
//
// });
