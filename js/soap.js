"use strict";

let SOAP = {
    _url: 'https://webmail.pentalog.fr/service/soap',
    _send: function(envelope) {
        return $.ajax({
            type: "POST",
            url: this._url,
            data: envelope
        });
    },
    _wrapMessage: function (xmlns, body, header = '') {
        return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns="` + xmlns + `">
    <soap:Header>` + header + `</soap:Header>
    <soap:Body>` + body + `</soap:Body>
</soap:Envelope>
`;
    },
    _buildEnvelope: function (token, xmlns, body) {
        return this._wrapMessage(xmlns, body, `<context><authToken>` + token + `</authToken></context>`);
    },
    authRequest: function (account, password) {
        return this._send(
            this._wrapMessage('urn:zimbraAccount', `<AuthRequest><account by="name">` + account + `</account><password>` + password + `</password></AuthRequest>`)
        );
    },
    getFolderRequest: function (token) {
        return this._send(
            this._buildEnvelope(token, 'urn:zimbraMail', '<GetFolderRequest />')
        );
    },
    search: function (token, query) {
        return this._send(
            this._buildEnvelope(token, 'urn:zimbraMail', '<SearchRequest><query>' + query +'</query></SearchRequest>')
        );
    },
    getAppointments: function (token) {
        return this._send(
            this._buildEnvelope(token, 'urn:zimbraMail', '<SearchRequest types="appointment" calExpandInstStart="' + getUTCNow() + '" sortBy="dateDesc"><query>is:anywhere</query></SearchRequest>')
        )
    },
    getAppointment: function (token, uid) {
        return this._send(
            this._buildEnvelope(token, 'urn:zimbraMail', '<GetAppointmentRequest uid="'+uid+'" />')
        );
    }
};
