var os = require('os');
var uuid = require('uuid');
var request = require('request');
var Q = require('q');

var platform = os.platform();
var release = os.release();

var rxAuthToken = /authenticationToken="([^"]+)"/;

function authHeaderVal(username, password) {
    var authString = username + ':' + password;
    var buffer = new Buffer(authString.toString(), 'binary');
    return 'Basic ' + buffer.toString('base64');
}

function requestSignIn(username, password) {
    var deferred = Q.defer();
    var identifier = uuid.v4();
    var options = {
        url: 'https://plex.tv/users/sign_in.xml',
        headers: {
            'Authorization': authHeaderVal(username, password),
            'X-Plex-Client-Identifier': identifier,
            'X-Plex-Product': 'App',
            'X-Plex-Version': '1.0',
            'X-Plex-Device': 'App',
            'X-Plex-Platform': platform,
            'X-Plex-Platform-Version': release,
            'X-Plex-Provides': 'controller'
        }
    };

    request.post(options, function(err, res, xmlBody) {
        if (err) {
            return deferred.reject(new Error('Couldnt request Plex.tv for authentication: ' + String(err)));
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

exports.retrieveAuthToken = function retrieveAuthToken(username, password) {
    return requestSignIn(username, password).then(extractAuthToken);
};
