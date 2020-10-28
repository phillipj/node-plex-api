var expect = require('expect.js');
var server = require('./server');

var ROOT_URL = '/';
var CLIENTS_URL = '/clients';

var PlexAPI = require('..');

describe('query()', () => {
    var api;

    beforeEach(() => {
        server.start();

        api = new PlexAPI('localhost');
    });

    afterEach(server.stop);

    it('should exist', () => {
        expect(api.query).to.be.a('function');
    });

    describe('options', () => {
        it('requires url options', () => {
            expect(() => {
                api.query();
            }).to.throwException('TypeError');
        });

        it('can accept url option as only parameter', () => {
            return api.query('/').then((result) => {
                expect(result).to.be.an('object');
            });
        });

        it('can accept url option as part of an options object', () => {
            return api.query({ uri: '/' }).then((result) => {
                expect(result).to.be.an('object');
            });
        });

        it('uses extra headers passed in options', () => {
            server.stop();
            var nockServer = server.start({
                reqheaders: {
                    'X-TEST-HEADER': 'X-TEST-HEADER-VAL',
                },
            });

            return api.query({ uri: '/', extraHeaders: { 'X-TEST-HEADER': 'X-TEST-HEADER-VAL' } }).then((result) => {
                expect(result).to.be.an('object');
                nockServer.done();
            });
        });
    });

    it('promise should fail when server fails', (done) => {
        server.fails();

        api.query(ROOT_URL)
            .then(() => {
                done(Error('Shouldnt succeed!'));
            })
            .catch((err) => {
                expect(err).not.to.be(null);
                done();
            });
    });

    it('promise should succeed when server responds', () => {
        return api.query(ROOT_URL).then((result) => {
            expect(result).to.be.an('object');
        });
    });

    it('should have response MediaContainer attributes as properties on the resolved result object', () => {
        return api.query(ROOT_URL).then((result) => {
            expect(result.version).to.contain('0.9.11.4.739-a4e710f');
        });
    });

    it('should have response child Directory items as result._children', () => {
        return api.query(ROOT_URL).then((result) => {
            expect(result._children.length).to.be(16);
        });
    });

    describe('Directory URI', () => {
        it('should provide an uri property', () => {
            return api.query(ROOT_URL).then((result) => {
                expect(result._children[0].uri).not.to.be(undefined);
            });
        });

        it('should provide an uri property combined of parent URI and the item key attribute', () => {
            return api.query('/library/sections').then((result) => {
                expect(result._children[0].uri).to.be('/library/sections/1');
            });
        });

        it('should use the key as the uri if the key is a root-relative path', () => {
            return api.query('/library/sections/1/all').then((result) => {
                expect(result._children[0].uri).to.be(result._children[0].key);
            });
        });
    });

    describe('Server URI', () => {
        it('should provide an uri property', () => {
            return api.query(CLIENTS_URL).then((result) => {
                expect(result._children[0].uri).not.to.be(undefined);
            });
        });

        it('should provide uri property used to control Plex application', () => {
            return api.query(CLIENTS_URL).then((result) => {
                expect(result._children[0].uri).to.be('/system/players/192.168.0.47');
            });
        });
    });

    describe('XML responses', () => {
        it('should convert XML to a JSON object', () => {
            var plexTvApi = new PlexAPI({
                hostname: 'plex.tv',
                port: 443,
            });

            server.stop();
            server.start({
                schemeAndHost: 'https://plex.tv',
                port: 443,
                contentType: 'application/xml',
            });

            return plexTvApi.query('/devices.xml').then((result) => {
                expect(result.MediaContainer).to.be.an('object');
                expect(result.MediaContainer.attributes.publicAddress).to.equal('47.1.2.4');
            });
        });
    });

    describe('response parser', () => {
        it('allows response parser to be provided upon client instantiation', () => {
            const staticResponseParser = () => Promise.resolve('Response parsing has been overriden');

            api = new PlexAPI({
                hostname: 'localhost',
                responseParser: staticResponseParser,
            });

            return api.query('/').then((result) => {
                expect(result).to.be('Response parsing has been overriden');
            });
        });
    });
});
