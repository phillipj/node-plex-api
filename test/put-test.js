var expect = require('expect.js');
var server = require('./server');

var ROOT_URL = '/';

var PlexAPI = require('..');

describe('putQuery()', function () {
    var api;

    beforeEach(function () {
        server.expectsPut();

        api = new PlexAPI('localhost');
    });

    afterEach(server.stop);

    it('should exist', function () {
        expect(api.putQuery).to.be.a('function');
    });

    describe('parameters', function () {
        it('requires url parameter', function () {
            expect(function () {
                api.putQuery();
            }).to.throwException('TypeError');
        });

        it('can accept url parameter as only parameter', function () {
            return api.putQuery('/');
        });

        it('can accept url parameter as part of a parameter object', function () {
            return api.putQuery({ uri: '/' });
        });

        it('uses extra headers passed in parameters', function () {
            server.stop();
            var nockServer = server.expectsPut({
                reqheaders: {
                    'X-TEST-HEADER': 'X-TEST-HEADER-VAL',
                },
            });

            return api
                .putQuery({ uri: '/', extraHeaders: { 'X-TEST-HEADER': 'X-TEST-HEADER-VAL' } })
                .then(function (result) {
                    nockServer.done();
                    return result;
                });
        });
    });

    it('promise should fail when server responds with failure status code', function () {
        return api.putQuery(ROOT_URL).catch(function (err) {
            expect(err).not.to.be(null);
        });
    });

    it('promise should succeed when request response status code is 200', function () {
        return api.putQuery(ROOT_URL);
    });

    it('promise should succeed when request response status code is 201', function () {
        server.stop();
        server.expectsPut({ statusCode: 201 });
        return api.putQuery(ROOT_URL);
    });

    it('should result in a PUT request', function () {
        return api.putQuery(ROOT_URL);
    });
});
