var os = require('os');
var uuid = require('uuid');
var url = require('url');
var request = require('request');
var Q = require('q');
var xml2js = require('xml2js');
var headers = require('plex-api-headers');
var extend = require('util')._extend;

var xmlToJSON = Q.denodeify(xml2js.parseString);

var uri = require('./uri');

var PLEX_SERVER_PORT = 32400;

function PlexAPI(options, deprecatedPort) {
    var opts = options || {};
    var hostname = typeof options === 'string' ? options : options.hostname;

    this.hostname = hostname;
    this.port = deprecatedPort || opts.port || PLEX_SERVER_PORT;
    this.https = opts.https;
    this.timeout = opts.timeout;
    this.username = opts.username;
    this.password = opts.password;
    this.managedUser = opts.managedUser;
    this.authToken = opts.token;
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

PlexAPI.prototype.query = function query(options) {
    if (typeof options === 'string') {
        // Support old method of only supplying a single `url` parameter
        options = { uri: options };
    }
    if (options.uri === undefined) {
        throw new TypeError('Requires uri parameter');
    }

    options.method = 'GET';
    options.parseResponse = true;

    return this._request(options).then(uri.attach(options.uri));
};

PlexAPI.prototype.postQuery = function postQuery(options) {
    if (typeof options === 'string') {
        // Support old method of only supplying a single `url` parameter
        options = { uri: options };
    }
    if (options.uri === undefined) {
        throw new TypeError('Requires uri parameter');
    }

    options.method = 'POST';
    options.parseResponse = true;

    return this._request(options).then(uri.attach(url));
};

PlexAPI.prototype.putQuery = function putQuery(options) {
    if (typeof options === 'string') {
        // Support old method of only supplying a single `url` parameter
        options = { uri: options };
    }
    if (options.uri === undefined) {
        throw new TypeError('Requires uri parameter');
    }

    options.method = 'PUT';
    options.parseResponse = true;

    return this._request(options).then(uri.attach(url));
};

PlexAPI.prototype.perform = function perform(options) {
    if (typeof options === 'string') {
        // Support old method of only supplying a single `url` parameter
        options = { uri: options };
    }
    if (options.uri === undefined) {
        throw new TypeError('Requires uri parameter');
    }

    options.method = 'GET';
    options.parseResponse = false;

    return this._request(options);
};

PlexAPI.prototype.find = function find(options, criterias) {
    if (typeof options === 'string') {
        // Support old method of only supplying a single `url` parameter
        options = { uri: options };
    }
    if (options.uri === undefined) {
        throw new TypeError('Requires uri parameter');
    }

    return this.query(options).then(function (result) {
        return filterChildrenByCriterias(result._children, criterias);
    });
};

PlexAPI.prototype._request = function _request(options) {
    var reqUrl = this._generateRelativeUrl(options.uri);
    var method = options.method;
    var timeout = this.timeout;
    var parseResponse = options.parseResponse;
    var extraHeaders = options.extraHeaders || {};
    var self = this;
    var deferred = Q.defer();

    var requestHeaders = headers(this, extend({
        'Accept': 'application/json',
        'X-Plex-Token': this.authToken,
        'X-Plex-Username': this.username
    }, extraHeaders));

    var reqOpts = {
        uri: url.parse(reqUrl),
        encoding: null,
        method: method || 'GET',
        timeout: timeout,
        gzip: true,
        headers: requestHeaders
    };

    request(reqOpts, function onResponse(err, response, body) {
        var resolveValue;

        if (err) {
            return deferred.reject(err);
        }

        resolveValue = body;

        // 403 forbidden when managed user does not have sufficient permission
        if (response.statusCode === 403) {
            return deferred.reject(new Error('Plex Server denied request due to lack of managed user permissions!'));
        }

        // 401 unauthorized when authentication is required against the requested URL
        if (response.statusCode === 401) {
            if (self.authenticator === undefined) {
                return deferred.reject(new Error('Plex Server denied request, you must provide a way to authenticate! ' +
                    'Read more about plex-api authenticators on https://www.npmjs.com/package/plex-api#authenticators'));
            }

            return deferred.resolve(self._authenticate()
                .then(function () {
                    return self._request(options);
                })
            );
        }

        if (response.statusCode < 200 || response.statusCode > 299) {
            return deferred.reject(new Error('Plex Server didnt respond with a valid 2xx status code, response code: ' + response.statusCode));
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
    return new Promise((resolve, reject) => {
        if (this.authToken) {
            return reject(new Error('Permission denied even after attempted authentication :( Wrong username and/or password maybe?'));
        }

        this.authenticator.authenticate(this, (err, token) => {
            if (err) {
                throw new Error('Authentication failed, reason: ' + err.message);
            }
            this.authToken = token;
            resolve();
        });
    });
};

PlexAPI.prototype._credentialsAuthenticator = function _credentialsAuthenticator() {
    var credentials;

    if (this.username && this.password) {
        credentials = require('plex-api-credentials');
        return credentials({
            username: this.username,
            password: this.password,
            managedUser: this.managedUser
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
    if (typeof this.https !== 'undefined') {
        // If https is supplied by the user, always do what it says
        return this.https ? 'https://' : 'http://';
    }
    // Otherwise, use https if it's on port 443, the standard https port.
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
