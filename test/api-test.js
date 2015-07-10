var expect = require('expect.js');
var server = require('./server');

var ROOT_URL = '/';

var PlexAPI = require('..');

describe('Module API', function() {
	var api;

	beforeEach(function() {
		server.start();

		api = new PlexAPI('localhost');
	});

	afterEach(server.stop);

	it('should expose constructor', function() {
		expect(PlexAPI).to.be.a('function');
	});

	it('should be instance of the PlexAPI', function() {
		expect('PlexAPI').to.be(api.constructor.name);
	});

	it('should require server host as first constructor parameter', function() {
		expect(function() {
			new PlexAPI();
		}).to.throwException('TypeError');
	});

	it('first parameter should set host of Plex Media Server', function() {
		expect(api.getHostname()).to.be('localhost');
	});

	it('should have configurable server port', function(done) {
		api = new PlexAPI({
			hostname: 'localhost',
			port: 32401
		});

		server.start({ port: 32401 });

		api.query(ROOT_URL).done(function(result) {
			expect(result).to.be.an('object');
			done();
		});
	});

	it('should have configurable options that get sent in every request', function() {
		api = new PlexAPI({
			hostname       : 'localhost',
			options: {
				identifier     : 'mock-identifier',
				product        : 'mock-product',
				version        : 'mock-version',
				device         : 'mock-device',
				deviceName     : 'mock-deviceName',
				platform       : 'mock-platform',
				platformVersion: 'mock-platformVersion'
			}
		});

		server.stop();
		var nockServer = server.start({
			reqheaders: {
				'X-Plex-Client-Identifier': 'mock-identifier',
				'X-Plex-Product'          : 'mock-product',
				'X-Plex-Version'          : 'mock-version',
				'X-Plex-Device'           : 'mock-device',
				'X-Plex-Device-Name'      : 'mock-deviceName',
				'X-Plex-Platform'         : 'mock-platform',
				'X-Plex-Platform-Version' : 'mock-platformVersion'
			}
		});

		api.query(ROOT_URL).done(function(result) {
			expect(result).to.be.an('object');
			nockServer.done();
		});
	});
});