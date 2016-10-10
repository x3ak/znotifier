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
    _buildEnvelope: function (token, xmlns, body) {
            return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns="` + xmlns + `">
    <soap:Header>
        <context>
            <authToken>` + token + `</authToken>
        </context>
    </soap:Header>
    <soap:Body>
        `+ body +`
    </soap:Body>
</soap:Envelope>`;
    },
    authRequest: function (account, password, callback, errorCallback) {
        $.get('soap/authRequest.xml')
            .done(function(xml){
                $.ajax({
                    type: "POST",
                    url: this._url,
                    data: xml.replace(/ACCOUNT_PLACEHOLDER/g, account)
                            .replace(/PASSWORD_PLACEHOLDER/g, password)
                })
                .done(callback)
                .fail(errorCallback || function () {});
            });
    },
    getFolderRequest: function (token, callback) {
        return this._send(
            this._buildEnvelope(token, 'urn:zimbraMail', '<GetFolderRequest />')
        )
        .done(callback);
    },
    search: function (token, query, callback) {
        return this._send(
            this._buildEnvelope(token, 'urn:zimbraMail', `<SearchRequest><query>` + query +`</query></SearchRequest>`)
        )
        .done(callback);
    },
    getAppointments: function (token) {
        return this._send(
            this._buildEnvelope(token, 'urn:zimbraMail', '<SearchRequest types="appointment" calExpandInstStart="` + getUTCNow() + `" sortBy="dateDesc">'+
            '<query>is:anywhere</query></SearchRequest>')
        )
    },
    getAppointment: function (token, uid) {
        return this._send(
            this._buildEnvelope(token, 'urn:zimbraMail', '<GetAppointmentRequest uid="'+uid+'" />')
        );
    }
};
