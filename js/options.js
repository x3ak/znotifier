"use strict";

let authToken = null;

let Router = {
    controllers: {
        authentication: function () {},
        index: function () {
            let $accountName = $(this).find('#sign-in-account');
            let $mailEnabled = $(this).find('[name=mailEnabled]');
            let $calendarEnabled = $(this).find('[name=calendarEnabled]');

            let changeModelByName = function () {
                let modelName = $(this).attr('name');

                let change = {};
                change[modelName] = $(this).prop('checked') == 1;

                chrome.storage.sync.set(change);
            };

            $mailEnabled.on('change', changeModelByName);
            $calendarEnabled.on('change', changeModelByName);

            // modifying view with the values from local storage
            chrome.storage.local.get(['account'], (items) => {
                $accountName.text(items.account || '');
            });

            // modifying view with the values from sync storage
            chrome.storage.sync.get(['mailEnabled', 'calendarEnabled'], (items) => {
                $mailEnabled.prop('checked', items.mailEnabled == undefined ? true : items.mailEnabled);
                $calendarEnabled.prop('checked', items.calendarEnabled == undefined ? true : items.calendarEnabled);
            });

        },
        folders: function () {
            SOAP.getFolderRequest(authToken)
                .done((response) => {

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

                            $foldersList.append($('<div />').append(row));
                        });

                    });
                });
        },
        logout: function () {
            chrome.storage.local.clear(function () {
                Router.showPage('authentication');
            });
        }
    },
    showPage: function (identifier) {

        $('.options-page.active').removeClass('active');

        if (this.controllers[identifier] == undefined) {
            console.error("No controller defined for: ", identifier);
            return;
        }

        let $section = $('#' + identifier + '-page');
        $section.addClass('active');

        console.info('Switched to the new section: ', identifier);

        this.controllers[identifier].apply($section);
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

    SOAP.authRequest(account, password)
        .done((response) => {
            let token = $(response).find('authToken').text();
            let lifeTime = $(response).find('lifetime').text();

            chrome.storage.local.set({
                token: token,
                account: account
            }, function () {
                console.info('Authenticated with token:', token);
                authToken = token;

                Router.showPage('index');
            });

        })
        .fail(() => {
            $('#authentication-error').show();
            Router.showPage('authentication');
        });
});

$(document).on('click', '[is=section-link]', function (e) {
    e.preventDefault();
    Router.showPage($(this).attr('section'));
});

