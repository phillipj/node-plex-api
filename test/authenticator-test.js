var assert = require('assert');
var sinon = require('sinon');
var proxyquire = require('proxyquire');

var server = require('./server');

var ROOT_URL = '/';

describe('Authenticator', function() {
    var authenticatorStub;
    var credentialsStub;

    var PlexAPI;
    var api;

    beforeEach(function() {
        authenticatorStub = sinon.stub().yields(null, 'abc-pretend-to-be-token');
        credentialsStub = sinon.stub().returns({
            authenticate: authenticatorStub
        });

        PlexAPI = proxyquire('..', {
            'plex-api-credentials': credentialsStub
        });

        api = new PlexAPI({
            hostname: 'localhost',
            authenticator: {
                authenticate: authenticatorStub
            }
        });
    });

    afterEach(server.stop);

    describe('.initialize()', function() {
        it('is called on authenticator if method exists when creating PlexAPI instances', function() {
            var authenticatorSpy = {
                initialize: sinon.spy()
            };

            api = new PlexAPI({
                hostname: 'localhost',
                authenticator: authenticatorSpy
            });

            assert(authenticatorSpy.initialize.calledOnce);
        });

        it('provides created PlexAPI object as argument', function() {
            var authenticatorSpy = {
                initialize: sinon.spy()
            };

            api = new PlexAPI({
                hostname: 'localhost',
                authenticator: authenticatorSpy
            });

            assert(authenticatorSpy.initialize.firstCall.calledWith(api));
        });
    });

    describe('.authenticate()', function() {
        it('is called on authenticator when Plex Server responds with 401', function() {
            server.start({
                statusCode: 401,
                expectRetry: true
            });

            return api.query(ROOT_URL).then(function() {
                assert(authenticatorStub.firstCall.calledWith(api), 'authenticator was called');
            });
        });

        it('provides options object and callback as arguments when calling authenticator', function() {
            server.start({
                statusCode: 401,
                expectRetry: true
            });

            return api.query(ROOT_URL).then(function() {
                var firstArg = authenticatorStub.firstCall.args[0];
                var secondArg = authenticatorStub.firstCall.args[1];

                assert.equal(typeof firstArg, 'object');
                assert.equal(typeof secondArg, 'function');
            });
        });

        it('retries original request with token given from authenticator', function() {
            scope = server.start({
                statusCode: 401,
                expectRetry: true
            });

            return api.query(ROOT_URL).then(function(result) {
                scope.done();
            });
        });

        it('rejects when providing token and server still responds with 401', function() {
            scope = server.start({
                statusCode: 401,
                retryStatusCode: 401,
                expectRetry: true
            });

            return api.query(ROOT_URL).then(
                function onSuccess(result) {
                    throw new Error('Query should not have succeeded!');
                },
                function onError() {
                    scope.done();
                }
            );
        });
    });

    describe('default authenticator', function() {
        it('uses the plex-api-credentials authenticator when options.username and .password are provided', function() {
            server.start({
                statusCode: 401,
                expectRetry: true
            });

            api = new PlexAPI({
                hostname: 'localhost',
                username: 'foo',
                password: 'bar'
            });

            return api.query(ROOT_URL).then(function() {
                assert(authenticatorStub.calledOnce, 'credentials authenticator was called');
            });
        });

        it('rejects with a missing authenticator error when options.username and .password were missing and Plex Server responds with 401', function() {
            server.start({
                statusCode: 401
            });

            api = new PlexAPI({
                hostname: 'localhost'
            });

            return api.query(ROOT_URL).then(null, function(err) {
                assert(err instanceof Error, 'rejected with an error instance');
                assert(
                    err.message.match(/you must provide a way to authenticate/),
                    'error message says authenticator is needed'
                );
            });
        });
    });
});
