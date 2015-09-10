var os = require('os');
var uuid = require('uuid');
var url = require('url');
var request = require('request');
var Q = require('q');
var xml2js = require('xml2js');
var headers = require('plex-api-headers');

var xmlToJSON = Q.denodeify(xml2js.parseString);

var uri = require('./uri');

var PLEX_SERVER_PORT = 32400;

function PlexAPI(options, deprecatedPort) {
    var opts = options || {};
    var hostname = typeof options === 'string' ? options : options.hostname;

    this.hostname = hostname;
    this.port = deprecatedPort || opts.port || PLEX_SERVER_PORT;
    this.username = opts.username;
    this.password = opts.password;
    this.authToken = opts.token || null;
    this.authenticator = opts.authenticator || this._credentialsAuthenticator();
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

    this.serverUrl = hostname + ':' + this.port;
    this._initializeAuthenticator();
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
    var reqUrl = this._generateRelativeUrl(relativeUrl);
    var reqOpts = {
        url: url.parse(reqUrl),
        encoding: null,
        method: method || 'GET',
        headers: headers(this, {
            'Accept': 'application/json',
            'X-Plex-Token': this.authToken,
            'X-Plex-Username': this.username
        })
    };

    request(reqOpts, function onResponse(err, response, body) {
        if (err) {
            return deferred.reject(err);
        }

        var resolveValue = body;

        if (response.statusCode === 401) {
            if (self.authenticator === undefined) {
                return deferred.reject(new Error('Plex Server denied request, you must provide a way to authenticate! ' +
                    'Read more about plex-api authenticators on https://www.npmjs.com/package/plex-api#authenticators'));
            }

            return deferred.resolve(self._authenticate()
                .then(function() {
                    return self._request(relativeUrl, method, parseResponse);
                })
            );
        }

        if (response.statusCode !== 200 && response.statusCode !== 201) {
            return deferred.reject(new Error('Plex Server didnt respond with status code 200, response code: ' + response.statusCode));
        }

        // prevent holding an open http agent connection by pretending to consume data,
        // releasing socket back to the agent connection pool: http://nodejs.org/api/http.html#http_agent_maxsockets
        response.on('data', function onData() {});

        if (!parseResponse) {
            return deferred.resolve();
        }

        if (response.headers['content-type'] === 'application/json') {
            resolveValue = JSON.parse(body.toString('utf8'));
        } else if (response.headers['content-type'].indexOf('xml') > -1) {
            resolveValue = xmlToJSON(body.toString('utf8'), { attrkey: 'attributes' });
        }

        return deferred.resolve(resolveValue);
    });

    return deferred.promise;
};

PlexAPI.prototype._authenticate = function _authenticate() {
    var self = this;
    var deferred = Q.defer();

    if (this.authToken) {
        return deferred.reject(new Error('Permission denied even after attempted authentication :( Wrong username and/or password maybe?'));
    }

    this.authenticator.authenticate(this, function(err, token) {
        if (err) {
            return deferred.reject(new Error('Authentication failed, reason: ' + err.message));
        }
        self.authToken = token;
        deferred.resolve();
    });

    return deferred.promise;
};

PlexAPI.prototype._credentialsAuthenticator = function _credentialsAuthenticator() {
    if (this.username && this.password) {
        var credentials = require('plex-api-credentials');

        return credentials({
            username: this.username,
            password: this.password
        });
    }
    return undefined;
};

PlexAPI.prototype._initializeAuthenticator = function _initializeAuthenticator() {
    if (this.authenticator && typeof this.authenticator.initialize === 'function') {
        this.authenticator.initialize(this);
    }
};

PlexAPI.prototype._generateRelativeUrl = function _generateRelativeUrl(relativeUrl) {
    return this._serverScheme() + this.serverUrl + relativeUrl;
};

PlexAPI.prototype._serverScheme = function _serverScheme() {
    return this.port === 443 ? 'https://' : 'http://';
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


module.exports = PlexAPI;
