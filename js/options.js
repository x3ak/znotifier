let authToken = null;

let Router = {
    _models: {},
    controllers: {
        authentication: function (promise, scope) {
            chrome.storage.local.get(['account'], (items) => {
                scope.account = items.account || '';
            });
        },
        index: function (promise, scope) {
            chrome.storage.local.get(['account', 'interval', 'mailEnabled', 'calendarEnabled'], (items) => {

                scope.account = items.account || '';
                scope.interval = (items.interval || 1) * 1;

                scope.mailEnabled = (items.mailEnabled || 1) == 1;
                scope.calendarEnabled = (items.calendarEnabled || 1) == 1;
                //
                // chrome.storage.sync.get(['folders'], (syncItems) => {
                //     let $foldersListRO = $('#folders-list-readonly').html('');
                //
                //     $.each((syncItems.folders || {}), (folderId, absPath) => {
                //         $foldersListRO.append('<li>' + absPath + '</li>');
                //     });
                // });
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

                        $foldersList.append($('<div />').append(row));
                    });

                });



            });
        },
        logout: function (promise, scope) {

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

        if (this._models[identifier] == undefined) {

            console.log('init model for', identifier);

            let model = {};
            let handler = {
                set: function (target, name, value) {

                    target[name] = value;

                    let $field = $section.find('[model="' + name + '"]');

                    if ($field.length > 0) {
                        if ($field.is(':checkbox')) {
                            $field.prop('checked', value);
                        } else {
                            $field.text(value);
                        }
                    }
                }
            };

            this._models[identifier] = new Proxy(model, handler);

            let self = this;
            $section.on('input', ':input[model]', function () {
                let $field = $(this);
                let val = null;

                if ($field.is(':checkbox')) {
                    val = $field.prop('checked');
                } else {
                    val = $field.val();
                }

                if (self._models[identifier][$field.attr('model')] != val) {
                    self._models[identifier][$field.attr('model')] = val;
                }
            });

            $section.find('[model]:not(input)').each(function () {
                $(this).text(self._models[identifier][$(this).attr('model')]);
            });

            $section.find('input[model]:not(:checkbox):not(:radio)').each(function () {
                $(this).val(self._models[identifier][$(this).attr('model')]);
            });

            $section.find('input[model]:checkbox, input[model]:radio').each(function () {
                $(this).prop('checked', self._models[identifier][$(this).attr('model')]);
            });

        }

        this.controllers[identifier](new $.Deferred(), this._models[identifier]);
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

