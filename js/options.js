let authToken = null;

let Router = {
    controllers: {
        authentication: function (promise) {
            chrome.storage.local.get(['token', 'account'], (items) => {
                promise.resolve({account: items.account || ''});
            });
        },
        index: function (promise) {
            chrome.storage.local.get(['account'], (items) => {
                promise.resolve({account: items.account || ''});
            });
        }
    },
    showPage: function (identifier) {
        $('.options-page.active').removeClass('active');

        let promise = new $.Deferred();
        if (this.controllers[identifier] != undefined) {
            this.controllers[identifier](promise);
            console.info('Executed controller for section: ', identifier);
        } else {
            promise.resolve(['aaaa']);
        }

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

$(document).ready(function(){
    console.log();
});

chrome.storage.local.get(['token', 'account'], function (items) {

    if (items.token == undefined) {
        Router.showPage('authentication');
    } else {
        authToken = items.token;
        $('#account-name').html(items.account);

        SOAP.getFolderRequest(authToken, function (response) {
            let $foldersList = $('#folders-list');
            let $foldersListRO = $('#folders-list-readonly');
            $foldersListRO.html('');
            let folders = [];

            $(response).find('folder[absFolderPath="/"] folder[view=message]').each((index, folder) => {

                let absPath = $(folder).attr('absFolderPath');
                let folderId = $(folder).attr('id');

                let row = $('<label />')
                    .append('<input type=checkbox name="' + folderId + '" value="' + absPath + '"> ')
                    .append('<span>' + absPath + '</span>');

                $foldersList.append($('<div class="settings-row" />').append(row));
            });

            chrome.storage.sync.get(['folders'], (items) => {
                let foldersSubscribed = [];

                if (items.folders != undefined) {
                    $.each(items.folders, function (folderId, absPath) {
                        $foldersList.find('[name='+folderId+']').prop('checked', true);
                        foldersSubscribed.push(absPath.replace(/^\//,''));
                    });
                }

                if (foldersSubscribed.length > 0) {
                    $foldersListRO.html(foldersSubscribed.join('; '));
                } else {
                    $foldersListRO.html('all');
                }
            });

        });

        Router.showPage('index');
    }
});


$(document).on('submit', 'form#folders-form', function(e){
    e.preventDefault();
    let $foldersListRO = $('#folders-list-readonly');
    $foldersListRO.html('');

    let folders = {};
    $(this).serializeArray().forEach(function (item) {
        folders[item.name] = item.value;

        $foldersListRO.append('<li>'+ item.value + '</li>');
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

            $('#account-name').html(account);
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
