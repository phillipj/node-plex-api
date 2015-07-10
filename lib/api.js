var os = require('os');
var uuid = require('uuid');
var url = require('url');
var request = require('request');
var Q = require('q');
var xml2js = require('xml2js');

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
    this.options.product = this.options.product || 'Node.js App';
    this.options.version = this.options.version || '1.0';
    this.options.device = this.options.device || os.platform();
    this.options.deviceName = this.options.deviceName || 'Node.js App';
    this.options.platform = this.options.platform || 'Node.js';
    this.options.platformVersion = this.options.platformVersion || process.version;

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

    return this._request(url, 'GET', true).then(uri.attach(url));
};

PlexAPI.prototype.postQuery = function query(url) {
    if (url === undefined) {
        throw new TypeError('Requires url argument');
    }

    return this._request(url, 'POST', true).then(uri.attach(url));
};

PlexAPI.prototype.perform = function perform(url) {
    if (url === undefined) {
        throw new TypeError('Requires url argument');
    }

    return this._request(url, 'GET', false);
};

PlexAPI.prototype.find = function find(relativeUrl, criterias) {
    if (relativeUrl === undefined) {
        throw new TypeError('Requires url argument');
    }

    return this.query(relativeUrl).then(function(result) {
        return filterChildrenByCriterias(result._children, criterias);
    });
};

PlexAPI.prototype._request = function _request(relativeUrl, method, parseResponse) {
    var self = this;
    var deferred = Q.defer();
    var reqUrl = generateRelativeUrl.call(this, relativeUrl);
    var reqOpts = {
        url: url.parse(reqUrl),
        encoding: null,
        method: method || 'GET',
        headers: {
            'Accept': 'application/json',
            'X-Plex-Client-Identifier': self.getIdentifier(),
            'X-Plex-Product': self.options.product,
            'X-Plex-Version': self.options.version,
            'X-Plex-Device': self.options.device,
            'X-Plex-Device-Name': self.options.deviceName,
            'X-Plex-Platform': self.options.platform,
            'X-Plex-Platform-Version': self.options.platformVersion,
            'X-Plex-Provides': 'controller'
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
            return deferred.resolve(self._authenticate()
                .then(function() {
                    return self._request(relativeUrl, method, parseResponse);
                })
            );
        }
        if (response.statusCode !== 200) {
            return deferred.reject(new Error('Plex Server didnt respond with status code 200, response code: ' + response.statusCode));
        }

        // prevent holding an open http agent connection by pretending to consume data,
        // releasing socket back to the agent connection pool: http://nodejs.org/api/http.html#http_agent_maxsockets
        response.on('data', function onData() {});

        if (parseResponse) {
            if (response.headers['content-type'] === 'application/json') {
                return deferred.resolve(JSON.parse(body.toString('utf8')));
            }
            if (response.headers['content-type'].indexOf('xml') > -1) {
                return deferred.resolve(xml2js.parseString(body.toString('utf8'), {
                    object: true
                }));
            }
            return deferred.resolve(body);
        } else {
            return deferred.resolve();
        }
    });

    return deferred.promise;
};

PlexAPI.prototype._authenticate = function _authenticate() {
    var self = this;
    var deferred = Q.defer();

    if (this.authToken) {
        return deferred.reject(new Error('Permission denied even after attempted authentication :( Wrong username and/or password maybe?'));
    }

    auth.retrieveAuthToken(self.username, self.password, self.options)
        .then(function onAuthResult(token) {
            self.authToken = token;
            deferred.resolve();
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

    return Object.keys(criterias).reduce(function matchCriteria(hasFoundMatch, currentRule) {
        var regexToMatch = new RegExp(criterias[currentRule]);
        return regexToMatch.test(child[currentRule]);
    }, true);
}

function generateRelativeUrl(relativeUrl) {
    return this.serverUrl + relativeUrl;
}

module.exports = PlexAPI;
