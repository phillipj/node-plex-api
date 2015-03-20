var url = require('url');
var request = require('request');
var Q = require('q');

var uri = require('./uri');

var PLEX_SERVER_PORT = 32400;

function PlexAPI(hostname, port) {
    this.hostname = hostname;
    this.port = port || PLEX_SERVER_PORT;

    if (typeof hostname !== 'string') {
        throw new TypeError('Invalid server hostname');
    }

    this.serverUrl = 'http://' + hostname + ':' + this.port;
}

PlexAPI.prototype.getHostname = function() {
    return this.hostname;
};

PlexAPI.prototype.getPort = function() {
    return this.port;
};

PlexAPI.prototype.query = function(url) {
    if (url === undefined) {
        throw new TypeError('Requires url argument');
    }

    return this._request(url).then(uri.attach(url));
};

PlexAPI.prototype.perform = function(relativeUrl) {
    if (relativeUrl === undefined) {
        throw new TypeError('Requires url argument');
    }

    var deferred = Q.defer();
    var reqUrl = generateRelativeUrl.call(this, relativeUrl);
    var reqOpts = {
        url: url.parse(reqUrl),
        json: true,
        headers: {
            'Accept': 'application/json'
        }
    };

    request.get(reqOpts, function onResponse(err, res) {
        if (err) {
            return deferred.reject(new Error('Error while requesting server: ' + String(err)));
        }
        if (res.statusCode !== 200) {
            return deferred.reject(new Error('Server didnt respond with status code 200, response code: ' + res.statusCode));
        }

        // prevent holding an open http agent connection by pretending to consume data,
        // releasing socket back to the agent connection pool: http://nodejs.org/api/http.html#http_agent_maxsockets
        res.on('data', function onData() {});

        deferred.resolve();
    }).on('error', function onReqError(err) {
        deferred.reject(err);
    });

    return deferred.promise;
};

PlexAPI.prototype.find = function(relativeUrl, criterias) {
    if (relativeUrl === undefined) {
        throw new TypeError('Requires url argument');
    }

    return this.query(relativeUrl).then(function(result) {
        return filterChildrenByCriterias(result._children, criterias);
    });
};

PlexAPI.prototype._request = function _request(relativeUrl) {
    var deferred = Q.defer();
    var reqUrl = generateRelativeUrl.call(this, relativeUrl);
    var reqOpts = {
        url: url.parse(reqUrl),
        json: true,
        headers: {
            'Accept': 'application/json'
        }
    };

    request(reqOpts, function onResponse(err, response, body) {
        if (err) {
            return deferred.reject(err);
        }

        return deferred.resolve(body);
    });

    return deferred.promise;
};

function filterChildrenByCriterias(children, criterias) {
    var context = {
        criterias: criterias || {}
    };

    return children.filter(criteriasMatchChild, context);
}

function criteriasMatchChild(child) {
    var criterias = this.criterias;

    return Object.keys(criterias).reduce(function(hasFoundMatch, currentRule) {
        var regexToMatch = new RegExp(criterias[currentRule]);
        return regexToMatch.test(child[currentRule]);
    }, true);
}

function generateRelativeUrl(relativeUrl) {
    return this.serverUrl + relativeUrl;
}

module.exports = PlexAPI;
