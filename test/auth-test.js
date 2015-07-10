var expect = require('expect.js');
var server = require('./server');

var ROOT_URL = '/';

var PlexAPI = require('..');

describe('Auth Tests', function() {
	var api;
	var scope;

	beforeEach(function() {
		scope = server.start({ statusCode: 401 });

		api = new PlexAPI({
			hostname: 'localhost',
			username: 'foo',
			password: 'bar'
		});
	});

	afterEach(server.stop);

	describe('query()', function() {

		it('should request https://plex.tv/users/sign_in.xml when Plex Server responds with 401', function () {
			var plexTvMock = server.requiresAuthToken();

			server.start();

			return api.query(ROOT_URL).then(function (result) {
				plexTvMock.done();
			});
		});

		it('should uses username / password given upon instantiation when requesting plex.tv', function () {
			var plexTvMock = server.requiresAuthToken({
				reqheaders: {
					'Authorization': 'Basic Zm9vOmJhcg=='
				}
			});

			server.start();

			return api.query(ROOT_URL).then(function (result) {
				plexTvMock.done();
			});
		});

		it('should retry original request with authentication token after requesting plex.tv', function () {
			var plexTvMock = server.requiresAuthToken();

			scope = server.start({
				reqheaders: {
					'X-Plex-Token': 'abc-pretend-to-be-token'
				}
			});

			return api.query(ROOT_URL).then(function (result) {
				scope.done();
			});
		});

		it('should override default options when specified', function () {
			api = new PlexAPI({
				hostname: 'localhost', username: 'foo', password: 'bar', options: {
					identifier: 'mock-identifier',
					product   : 'mock-product',
					version   : 'mock-version',
					device    : 'mock-device'
				}
			});

			scope = server.requiresAuthToken({
				reqheaders: {
					'X-Plex-Client-Identifier': 'mock-identifier',
					'X-Plex-Product'          : 'mock-product',
					'X-Plex-Version'          : 'mock-version',
					'X-Plex-Device'           : 'mock-device'
				}
			});

			server.start()

			return api.query(ROOT_URL).then(function (result) {
				scope.done();
			});
		});
	});

	describe('perform()', function() {

		it('should request https://plex.tv/users/sign_in.xml when Plex Server responds with 401', function () {
			var plexTvMock = server.requiresAuthToken();

			server.start();

			return api.perform(ROOT_URL).then(function (result) {
				plexTvMock.done();
			});
		});

		it('should uses username / password given upon instantiation when requesting plex.tv', function () {
			var plexTvMock = server.requiresAuthToken({
				reqheaders: {
					'Authorization': 'Basic Zm9vOmJhcg=='
				}
			});

			server.start();

			return api.perform(ROOT_URL).then(function (result) {
				plexTvMock.done();
			});
		});

		it('should retry original request with authentication token after requesting plex.tv', function () {
			var plexTvMock = server.requiresAuthToken();

			scope = server.start({
				reqheaders: {
					'X-Plex-Token': 'abc-pretend-to-be-token'
				}
			});

			return api.perform(ROOT_URL).then(function (result) {
				scope.done();
			});
		});

		it('should override default options when specified', function () {
			api = new PlexAPI({
				hostname: 'localhost', username: 'foo', password: 'bar', options: {
					identifier     : 'mock-identifier',
					product        : 'mock-product',
					version        : 'mock-version',
					device         : 'mock-device',
					deviceName     : 'mock-deviceName',
					platform       : 'mock-platform',
					platformVersion: 'mock-platformVersion'
				}
			});

			scope = server.requiresAuthToken({
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

			server.start()

			return api.perform(ROOT_URL).then(function (result) {
				scope.done();
			});
		});
	});
});