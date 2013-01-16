var buster = require("buster");
var server = require("./server");

var ROOT_URL = "/";
var PERFORM_URL = "/library/sections/1/refresh";

var PlexAPI = require("..");

buster.testCase("Module API", {
	setUp: function() {
		server.start();
		this.api = new PlexAPI("localhost");
	},

	tearDown: function() {
		try {
			server.stop();
		} catch (ignoredException) {}
	},

	"module exposes constructor": function() {
		assert.isFunction(PlexAPI);
	},

	"should be instance of the PlexAPI": function() {
		assert(this.api instanceof PlexAPI);
	},

	"should have configurable server port": function(done) {
		this.api = new PlexAPI("localhost", 32401);
		server.stop();
		server.start(32401);

		this.api.query(ROOT_URL, function(err, result) {
			assert.isObject(result);
			done();
		});
	}
});