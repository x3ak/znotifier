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
    },
    getAppointments: function (token) {

        let start = getUTCNow();// - 2 * 60 * 60 * 1000; // 4 min

        return $.ajax({
            type: "POST",
            url: 'https://webmail.pentalog.fr/service/soap',
            data: `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns="urn:zimbraMail">
    <soap:Header>
        <context xmlns="urn:zimbraMail">
            <nonotify />
            <noqualify />
            <authToken>` + token + `</authToken>
        </context>
    </soap:Header>
    <soap:Body>
        <SearchRequest types="appointment" calExpandInstStart="` + start + `" sortBy="dateDesc" >
            <query>is:anywhere</query>
        </SearchRequest>
    </soap:Body>
</soap:Envelope>
`

            // apply range
            // show planned duration  ? all day (alarms?!)
            // show if is recurring
            // <GetFreeBusyRequest  xmlns="urn:zimbraMail" s="`+start+`" e="`+end+`" name="pgalaton" />

        });

    },
    getAppointment: function (token, uid) {

        return $.ajax({
            type: "POST",
            url: 'https://webmail.pentalog.fr/service/soap',
            data: `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns="urn:zimbraMail">
    <soap:Header>
        <context xmlns="urn:zimbraMail">
            <nonotify />
            <noqualify />
            <authToken>` + token + `</authToken>
        </context>
    </soap:Header>
    <soap:Body>
        <GetAppointmentRequest uid="`+uid+`" />
    </soap:Body>
</soap:Envelope>
`

            // apply range
            // show planned duration  ? all day (alarms?!)
            // show if is recurring
            // <GetFreeBusyRequest  xmlns="urn:zimbraMail" s="`+start+`" e="`+end+`" name="pgalaton" />

        });

    }
};
