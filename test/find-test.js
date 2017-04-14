var expect = require('expect.js');
var server = require('./server');

var PlexAPI = require('..');

describe('find()', function() {
    var api;

    beforeEach(function() {
        server.start();

        api = new PlexAPI('localhost');
    });

    afterEach(server.stop);

    it('should exist', function() {
        expect(api.find).to.be.a('function');
    });

    describe('parameters', function() {
        it('requires url parameter', function() {
            expect(function() {
                api.find();
            }).to.throwException('TypeError');
        });

        it('can accept url parameter as only parameter', function() {
            return api.find('/').then(function(result) {
                expect(result).to.be.an('object');
            });
        });

        it('can accept url parameter as part of a parameter object', function() {
            return api.find({ uri: '/' }).then(function(result) {
                expect(result).to.be.an('object');
            });
        });

        it('uses extra headers passed in parameters', function() {
            server.stop();
            var nockServer = server.start({
                reqheaders: {
                    'X-TEST-HEADER': 'X-TEST-HEADER-VAL'
                }
            });

            return api
                .find({ uri: '/', extraHeaders: { 'X-TEST-HEADER': 'X-TEST-HEADER-VAL' } })
                .then(function(result) {
                    expect(result).to.be.an('object');
                    nockServer.done();
                });
        });
    });

    it('should provide all child items found', function() {
        return api.find('/library/sections').then(function(directories) {
            expect(directories).to.be.an('array');
            expect(directories.length).to.be(2);
        });
    });

    it('should filter items when given an object of criterias as second parameter', function() {
        return api.find('/library/sections', { type: 'movie' }).then(function(directories) {
            expect(directories.length).to.be(1);
        });
    });

    it('should match item attributes by regular expression', function() {
        return api.find('/library/sections', { type: 'movie|photo' }).then(function(directories) {
            expect(directories.length).to.be(2);
        });
    });

    it('should provide all Server items found', function() {
        return api.find('/clients').then(function(clients) {
            expect(clients[0].name).to.be('mac-mini');
        });
    });
});
