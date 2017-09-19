var expect = require('expect.js');
var server = require('./server');

var ROOT_URL = '/';

var PlexAPI = require('..');

describe('deleteQuery()', function() {
    var api;

    beforeEach(function() {
        server.expectsDelete();

        api = new PlexAPI('localhost');
    });

    afterEach(server.stop);

    it('should exist', function() {
        expect(api.deleteQuery).to.be.a('function');
    });

    describe('parameters', function() {
        it('requires url parameter', function() {
            expect(function() {
                api.deleteQuery();
            }).to.throwException('TypeError');
        });

        it('can accept url parameter as only parameter', function() {
            return api.deleteQuery('/');
        });

        it('can accept url parameter as part of a parameter object', function() {
            return api.deleteQuery({ uri: '/' });
        });

        it('uses extra headers passed in parameters', function() {
            server.stop();
            var nockServer = server.expectsDelete({
                reqheaders: {
                    'X-TEST-HEADER': 'X-TEST-HEADER-VAL'
                }
            });

            return api
                .deleteQuery({ uri: '/', extraHeaders: { 'X-TEST-HEADER': 'X-TEST-HEADER-VAL' } })
                .then(function(result) {
                    nockServer.done();
                    return result;
                });
        });
    });

    it('promise should fail when server responds with failure status code', function() {
        return api.deleteQuery(ROOT_URL).catch(function(err) {
            expect(err).not.to.be(null);
        });
    });

    it('promise should succeed when request response status code is 200', function() {
        return api.deleteQuery(ROOT_URL);
    });

    it('promise should succeed when request response status code is 204', function() {
        server.stop();
        server.expectsDelete({ statusCode: 204 });
        return api.deleteQuery(ROOT_URL);
    });

    it('promise should fail when server response status code is 404', function() {
        server.stop();
        server.expectsDelete({ statusCode: 404 });
        return api.deleteQuery(ROOT_URL).catch(function(err) {
            expect(err).not.to.be(null);
        });
    });

    it('after delete request server should respond with status code 404', function(done) {
        api.deleteQuery(ROOT_URL).then(function(res) {
            expect(res).to.be.undefined;

            api.deleteQuery(ROOT_URL).catch(function(err) {
                expect(err).not.to.be(null);
                expect(err.statusCode).to.be(404);
                done();
            });
        });
    });

    it('should result in a DELETE request', function() {
        return api.deleteQuery(ROOT_URL);
    });
});
