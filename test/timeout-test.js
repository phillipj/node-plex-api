var expect = require('expect.js');
var server = require('./server');

var ROOT_URL = '/';

var PlexAPI = require('..');

describe('timeoutError()', function() {
	var api;

	beforeEach(function() {
		server.timeoutError();

		api = new PlexAPI('localhost');
	});

	afterEach(server.stop);

	describe('timeout', function() {

});
