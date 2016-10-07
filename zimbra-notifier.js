let ZimbraNotifier = {

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
        chrome.storage.sync.get(['folders','interval'], (items) => {
            promise.resolve({
                folders: items.folders || {},
                interval: ((items.interval || 1) * 60* 1000)
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
    }
};
