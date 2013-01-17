var buster = require("buster");
var server = require("./server");

var ROOT_URL = "/";
var CLIENTS_URL = "/clients";

var PlexAPI = require("..");

buster.testCase("query()", {
	setUp: function() {
		server.start();
		this.api = new PlexAPI("localhost");
	},

	tearDown: function() {
		try {
			server.stop();
		} catch (ignoredException) {}
	},

	"method exists": function() {
		assert.isFunction(this.api.query);
	},

	"requires url parameter": function() {
		assert.exception(function() {
			this.api.query();
		}, "TypeError");
	},

	"requires callback parameter": function() {
		assert.exception(function() {
			this.api.query(ROOT_URL);
		}, "TypeError");
	},

	"should provide error as first argument to callback when unable to connect": function(done) {
		server.stop();
		this.api.query(ROOT_URL, function(err) {
			refute.isNull(err);
			done();
		});
	},

	"should not have an error argument when server responds": function(done) {
		this.api.query(ROOT_URL, function(err, result) {
			assert.isNull(err);
			assert.isObject(result);
			done();
		});
	},

	"should have response MediaContainer attributes as result.attributes": function(done) {
		this.api.query(ROOT_URL, function(err, result) {
			assert.match(result, { attributes: {
				version: '0.9.7'
			}});
			done();
		});
	},

	"should have response Directory items as result.directories": function(done) {
		this.api.query(ROOT_URL, function(err, result) {
			assert(result.directory.length === 2);
			done();
		});
	},

	"Directory URI": {
		"should provide an uri property": function(done) {
			this.api.query(ROOT_URL, function(err, result) {
				assert.defined(result.directory[0].uri);
				done();
			});
		},

		"should provide an uri property combined of parent's URI and the item's key attribute": function(done) {
			this.api.query("/library/sections", function(err, result) {
				assert.equals(result.directory[0].uri, "/library/sections/1");
				done();
			});
		}
	},

	"Server URI": {
		"should provide an uri property": function(done) {
			this.api.query(CLIENTS_URL, function(err, result) {
				assert.defined(result.server[0].uri);
				done();
			});
		},

		"should provide uri property used to control Plex application": function(done) {
			this.api.query(CLIENTS_URL, function(err, result) {
				assert.equals(result.server[0].uri, "/system/players/192.168.0.2");
				done();
			});			
		}
	}
});