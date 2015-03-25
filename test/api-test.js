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
		api = new PlexAPI('localhost', 32401);
		server.start(32401);

		api.query(ROOT_URL).done(function(result) {
			expect(result).to.be.an('object');
			done();
		});
	});
});