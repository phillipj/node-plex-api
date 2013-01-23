var buster = require("buster");
var server = require("./server");

var ROOT_URL = "/";
var PERFORM_URL = "/library/sections/1/refresh";

var PlexAPI = require("..");

buster.testCase("find()", {
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
		assert.isFunction(this.api.find);
	},

	"requires url parameter": function() {
		assert.exception(function() {
			this.api.find();
		}, "TypeError");
	},

	"requires callback parameter": function() {
		assert.exception(function() {
			this.api.find("/");
		}, "TypeError");
	},

	"should provide all Directory items found": function(done) {
		this.api.find("/library/sections", function(err, directories) {
			assert.isArray(directories);
			assert.equals(directories.length, 3);
			done();
		});
	},

	"should filter directories when given an object of critierias as second parameter": function(done) {
		this.api.find("/library/sections", {type: "movie"}, function(err, directories) {
			assert.equals(directories.length, 2);
			done();
		});
	},

	"should provide all Server items found": function(done) {
		this.api.find("/clients", function(err, clients) {
			var firstServer = clients[0];
			assert.equals(firstServer.attributes.name, "mac-mini");
			done();
		});
	}
});