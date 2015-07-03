var uuid = require('uuid');
var url = require('url');
var request = require('request');
var Q = require('q');
var xml2json = require('xml2json');

var uri = require('./uri');
var auth = require('./auth');

var PLEX_SERVER_PORT = 32400;

function PlexAPI(options, deprecatedPort) {
    var opts = options || {};
    var hostname = typeof options === 'string' ? options : options.hostname;

    this.hostname = hostname;
    this.port = deprecatedPort || opts.port || PLEX_SERVER_PORT;
    this.username = opts.username;
    this.password = opts.password;
    this.options = opts.options || {};
    this.options.identifier = this.options.identifier || uuid.v4();

    if (typeof this.hostname !== 'string') {
        throw new TypeError('Invalid Plex Server hostname');
    }
    if (typeof deprecatedPort !== 'undefined') {
        console.warn('PlexAPI constuctor port argument is deprecated, use an options object instead.');
    }

    this.serverUrl = 'http://' + hostname + ':' + this.port;
}

PlexAPI.prototype.getHostname = function getHostname() {
    return this.hostname;
};

PlexAPI.prototype.getPort = function getPort() {
    return this.port;
};

PlexAPI.prototype.getIdentifier = function getIdentifier() {
    return this.options.identifier;
};

PlexAPI.prototype.query = function query(url) {
    if (url === undefined) {
        throw new TypeError('Requires url argument');
    }

    return this._request(url).then(uri.attach(url));
};

PlexAPI.prototype.postQuery = function query(url) {
    if (url === undefined) {
        throw new TypeError('Requires url argument');
    }

    return this._post(url).then(uri.attach(url));
};

PlexAPI.prototype.perform = function perform(relativeUrl) {
    if (relativeUrl === undefined) {
        throw new TypeError('Requires url argument');
    }

    var self = this;
    var deferred = Q.defer();
    var reqUrl = generateRelativeUrl.call(this, relativeUrl);
    var reqOpts = {
        url: url.parse(reqUrl),
        json: true,
        headers: {
            'Accept': 'application/json'
        }
    };

    if (this.authToken) {
        reqOpts.headers['X-Plex-Token'] = this.authToken;
    }

    if (this.username) {
        reqOpts.headers['X-Plex-Username'] = this.username;
    }

    request.get(reqOpts, function onResponse(err, res) {
        if (err) {
            return deferred.reject(new Error('Error while requesting server: ' + String(err)));
        }
        if (res.statusCode === 401) {
            return deferred.resolve(self._authenticateAndRetry(relativeUrl, self.perform));
        }
        if (res.statusCode !== 200) {
            return deferred.reject(new Error('Plex Server didnt respond with status code 200, response code: ' + res.statusCode));
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

PlexAPI.prototype.find = function find(relativeUrl, criterias) {
    if (relativeUrl === undefined) {
        throw new TypeError('Requires url argument');
    }

    return this.query(relativeUrl).then(function(result) {
        return filterChildrenByCriterias(result._children, criterias);
    });
};

PlexAPI.prototype._request = function _request(relativeUrl) {
    var self = this;
    var deferred = Q.defer();
    var reqUrl = generateRelativeUrl.call(this, relativeUrl);
    var reqOpts = {
        url: url.parse(reqUrl),
        encoding: null,
        headers: {
            'Accept': 'application/json'
        }
    };

    if (this.authToken) {
        reqOpts.headers['X-Plex-Token'] = this.authToken;
    }

    if (this.username) {
        reqOpts.headers['X-Plex-Username'] = this.username;
    }

    request(reqOpts, function onResponse(err, response, body) {
        if (err) {
            return deferred.reject(err);
        }
        if (response.statusCode === 401) {
            return deferred.resolve(self._authenticateAndRetry(relativeUrl, self._request));
        }
        if (response.statusCode !== 200) {
            return deferred.reject(new Error('Plex Server didnt respond with status code 200, response code: ' + response.statusCode));
        }
        if (response.headers['content-type'] === 'application/json') {
            return deferred.resolve(JSON.parse(body.toString('utf8')));
        }
        if (response.headers['content-type'].indexOf('xml') > -1) {
            return deferred.resolve(xml2json.toJson(body.toString('utf8'), {
                object: true
            }));
        }
        return deferred.resolve(body);

    });

    return deferred.promise;
};

PlexAPI.prototype._post = function perform(relativeUrl) {
    var self = this;
    var deferred = Q.defer();
    var reqUrl = generateRelativeUrl.call(this, relativeUrl);
    var reqOpts = {
        url: url.parse(reqUrl),
        encoding: null,
        headers: {
            'Accept': 'application/json',
            'X-Plex-Client-Identifier': self.getIdenfier()
        }
    };

    if (this.authToken) {
        reqOpts.headers['X-Plex-Token'] = this.authToken;
    }

    if (this.username) {
        reqOpts.headers['X-Plex-Username'] = this.username;
    }

    request.post(reqOpts, function onResponse(err, response, body) {
        if (err) {
            return deferred.reject(err);
        }
        if (response.statusCode === 401) {
            return deferred.resolve(self._authenticateAndRetry(relativeUrl, self._post));
        }
        if (response.statusCode !== 200) {
            return deferred.reject(new Error('Plex Server didnt respond with status code 200, response code: ' + response.statusCode));
        }
        if (response.headers['content-type'] === 'application/json') {
            return deferred.resolve(JSON.parse(body.toString('utf8')));
        }
        if (response.headers['content-type'].indexOf('xml') > -1) {
            return deferred.resolve(xml2json.toJson(body.toString('utf8'), {
                object: true
            }));
        }
        return deferred.resolve(body);

    });

    return deferred.promise;
};

PlexAPI.prototype._authenticateAndRetry = function _authenticateAndRetry(url, retryfunc) {
    var self = this;

    if (this.authToken) {
        return Q.reject(new Error('Permission denied even after attempted authentication :( Wrong username and/or password maybe?'));
    }

    return auth.retrieveAuthToken(self.username, self.password, self.options)
            .then(function onAuthResult(token) {
                self.authToken = token;
                return retryfunc.call(self, url);
            });
};

function filterChildrenByCriterias(children, criterias) {
    var context = {
        criterias: criterias || {}
    };

    return children.filter(criteriasMatchChild, context);
}

function criteriasMatchChild(child) {
    var criterias = this.criterias;

    return Object.keys(criterias).reduce(function matchCriteria(hasFoundMatch, currentRule) {
        var regexToMatch = new RegExp(criterias[currentRule]);
        return regexToMatch.test(child[currentRule]);
    }, true);
}

function generateRelativeUrl(relativeUrl) {
    return this.serverUrl + relativeUrl;
}

module.exports = PlexAPI;
