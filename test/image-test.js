var expect = require('expect.js');
var server = require('./server');

var PlexAPI = require('..');

describe('query()', function() {
	var api;

	beforeEach(function() {
		server.start().defaultReplyHeaders({
			'Content-Type': 'image/jpg'
		});

		api = new PlexAPI('localhost');
	});

	afterEach(server.stop);


	it('resource endpoint should return a buffer', function() {
		return api.query('/resources/movie-creative-commons-flowercat.jpg').then(function(result) {
			// throw new Error(typeof result);
			console.log(result);
			expect(result).to.be.a(Buffer);
		},function(e) {
			console.log('teste', e);
		});
	});
	
});