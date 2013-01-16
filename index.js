var request = require("request");
var xml2json = require("xml2js");
var http = require("http");

var PLEX_SERVER_PORT = 32400;

module.exports = PlexAPI;

function PlexAPI(hostname, port) {
	this.hostname = hostname;
	this.serverUrl = "http://" + hostname + ":" + (port || PLEX_SERVER_PORT);
}

PlexAPI.prototype.query = function(url, callback) {
	if (url === undefined) {
		throw new TypeError("Requires url argument");
	}
	if (callback === undefined) {
		throw new TypeError("Requires callback argument");
	}

	retrieveJsonFromUrl.call(this, url, function(err, json) {
		var result;
		var items;

		if (!err) {
			items = json.MediaContainer.Directory;
			attachUriOnDirectories(url, items);

			result = {
				attributes: json.MediaContainer.attributes,
				directories: json.MediaContainer.Directory
			};
		}

		callback(err, result);
	});
};

function attachUriOnDirectories(url, directories) {
	directories.forEach(function(directory) {
		var parentUrl = url;
		if (parentUrl[parentUrl.length - 1] !== "/") {
			parentUrl += "/";
		}

		directory.uri = parentUrl + directory.attributes.key;
	});
}

PlexAPI.prototype.perform = function(relativeUrl, callback) {
	var url;

	if (relativeUrl === undefined) {
		throw new TypeError("Requires url argument");
	}
	if (callback === undefined) {
		throw new TypeError("Requires callback argument");
	}

	url = generateRelativeUrl.call(this, relativeUrl);
	http.get(url, function(res) {
		callback(null, res.statusCode === 200);
	}).on("error", function(err) {
		callback(err);
	});
};

PlexAPI.prototype.find = function(relativeUrl) {
	var criterias = (arguments.length > 2) ? arguments[1] : {};
	var callback = Array.prototype.slice.call(arguments, -1)[0];

	if (relativeUrl === undefined) {
		throw new TypeError("Requires url argument");
	}
	if (typeof callback !== "function") {
		throw new TypeError("Requires callback argument");
	}

	this.query(relativeUrl, function(err, result) {
		var allDirectories = result ? result.directories : [];
		var directories = filterDirectories(allDirectories, criterias);
		callback(err, directories);
	});
};

function filterDirectories(directories, criterias) {
	return directories.filter(function(directory) {
		var isMatch = true;
		var rule;
		
		for (rule in criterias) {
			if (!criterias.hasOwnProperty(rule)) { continue; }
			if (directory.attributes[rule] !== criterias[rule]) {
				isMatch = false;
				break;
			}
		}

		return isMatch;
	});
}

function retrieveJsonFromUrl(relativeUrl, callback) {
	var url = generateRelativeUrl.call(this, relativeUrl);
	request(url, function(err, response, xml) {
		if (err) {
			return callback(err);
		}

		convertXmlToJson(xml, function(convertError, json) {
			callback(convertError, json);
		});
	});
}

function convertXmlToJson(xml, callback) {
	var parser = new xml2json.Parser({ attrkey: "attributes" });
	parser.parseString(xml, function(err, result) {
		callback(err, result);
	});
}

function generateRelativeUrl(relativeUrl) {
	return this.serverUrl + relativeUrl;
}