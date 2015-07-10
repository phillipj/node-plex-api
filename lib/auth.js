var request = require('request');
var Q = require('q');

var rxAuthToken = /authenticationToken="([^"]+)"/;

function authHeaderVal(username, password) {
    var authString = username + ':' + password;
    var buffer = new Buffer(authString.toString(), 'binary');
    return 'Basic ' + buffer.toString('base64');
}

function requestSignIn(username, password, headers) {
    var deferred = Q.defer();
    var options = {
        url: 'https://plex.tv/users/sign_in.xml',
        headers: {
            'Authorization': authHeaderVal(username, password),
            'X-Plex-Client-Identifier': headers.identifier,
            'X-Plex-Product': headers.product,
            'X-Plex-Version': headers.version,
            'X-Plex-Device': headers.device,
            'X-Plex-Device-Name': headers.deviceName,
            'X-Plex-Platform': headers.platform,
            'X-Plex-Platform-Version': headers.platformVersion,
            'X-Plex-Provides': 'controller'
        }
    };
    request.post(options, function(err, res, xmlBody) {
        if (err) {
            return deferred.reject(new Error('Error while requesting https://plex.tv for authentication: ' + String(err)));
        }
        if (res.statusCode !== 201) {
            return deferred.reject(new Error('Invalid status code in authentication response from Plex.tv, expected 201 but got ' + res.statusCode));
        }
        deferred.resolve(xmlBody);
    });

    return deferred.promise;
}

function extractAuthToken(xmlBody) {
    var tokenMatches = xmlBody.match(rxAuthToken);
    if (!tokenMatches) {
        throw new Error('Couldnt not find authentication token in response from Plex.tv :(');
    }
    return tokenMatches[1];
}

exports.retrieveAuthToken = function retrieveAuthToken(username, password, options) {
    return requestSignIn(username, password, options).then(extractAuthToken);
};
