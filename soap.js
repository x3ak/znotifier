let SOAP = {
    authRequest: function (account, password, callback, errorCallback) {
        $.get('soap/authRequest.xml')
            .done(function(xml){
                $.ajax({
                    type: "POST",
                    url: 'https://webmail.pentalog.fr/service/soap',
                    data: xml.replace(/ACCOUNT_PLACEHOLDER/g, account)
                            .replace(/PASSWORD_PLACEHOLDER/g, password)
                })
                .done(callback)
                .fail(errorCallback || function () {});
            });
    },
    getFolderRequest: function (token, callback) {
        $.get('soap/getFolderRequest.xml')
            .done(function(xml){
                $.ajax({
                    type: "POST",
                    url: 'https://webmail.pentalog.fr/service/soap',
                    data: xml.replace(/AUTH_TOKEN_PLACEHOLDER/g, token)
                })
                .done(callback)
            });
    },
    search: function (token, query, callback) {
        $.get('soap/searchRequest.xml')
            .done(function(xml){
                $.ajax({
                    type: "POST",
                    url: 'https://webmail.pentalog.fr/service/soap',
                    data: xml.replace(/AUTH_TOKEN_PLACEHOLDER/g, token)
                            .replace(/QUERY_PLACEHOLDER/g, query)
                })
                .done(callback)
            });
    }
};
