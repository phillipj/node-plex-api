var request = require("request");
var xml2json = require("xml2js");
var http = require("http");
var uri = require("./uri");

var PLEX_SERVER_PORT = 32400;

module.exports = PlexAPI;

function PlexAPI(hostname, port) {
	this.hostname = hostname;
	this.port = port || PLEX_SERVER_PORT;

	if (typeof hostname !== "string") {
		throw new TypeError("Invalid server hostname");
	}

	this.serverUrl = "http://" + hostname + ":" + this.port;
}

PlexAPI.prototype.getHostname = function() {
	return this.hostname;
};

PlexAPI.prototype.getPort = function() {
	return this.port;
};

PlexAPI.prototype.query = function(url, callback) {
	if (url === undefined) {
		throw new TypeError("Requires url argument");
	}
	if (callback === undefined) {
		throw new TypeError("Requires callback argument");
	}

	retrieveJsonFromUrl.call(this, url, function(err, result) {
		if (!err) {
			uri.attach(url, result);
		}

		callback(err, result);
	});
};

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
	var callback = arguments[arguments.length - 1];

	if (relativeUrl === undefined) {
		throw new TypeError("Requires url argument");
	}
	if (typeof callback !== "function") {
		throw new TypeError("Requires callback argument");
	}

	this.query(relativeUrl, function(err, result) {
		var allChildren = getChildrenOfResult(result);
		var matchedChildren = filterChildrenByCriterias(allChildren, criterias);
		callback(err, matchedChildren);
	});
};

function getChildrenOfResult(result) {
	if (!result) { return []; }

	var item;
	var children = [];

	for (var itemName in result) {
		item = result[itemName];

		if (!result.hasOwnProperty(itemName)) { continue; }
		if (Array.isArray(item)) {
			children[itemName] = item;
		}
	}

	return children;
}

function filterChildrenByCriterias(children, criterias) {
	var matchedChildren;
	var filteredChildren = {};

	for (var childName in children) {
		if (!children.hasOwnProperty(childName)) { continue; }

		matchedChildren = children[childName].filter(function(child) {
			var isMatch = true;
			var regexToMatch;

			for (var rule in criterias) {
				regexToMatch = new RegExp(criterias[rule]);

				if (!criterias.hasOwnProperty(rule)) { continue; }
				if (!child.attributes || !regexToMatch.test(child.attributes[rule])) {
					isMatch = false;
					break;
				}
			}

			return isMatch;
		});

		if (matchedChildren.length > 0) {
			filteredChildren[childName] = matchedChildren;
		}
	}

	if (objectHasOnlyOneProperty(filteredChildren)) {
		filteredChildren = getFirstPropertyOf(filteredChildren);
	}

	return filteredChildren;
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
	new xml2json.Parser({
		attrkey: "attributes",
		explicitRoot: false,
		normalizeTags: true
	}).parseString(xml, function(err, result) {
		callback(err, result);
	});
}

function generateRelativeUrl(relativeUrl) {
	return this.serverUrl + relativeUrl;
}

function objectHasOnlyOneProperty(object) {
	return Object.keys(object).length === 1;
}

function getFirstPropertyOf(object) {
	return object[Object.keys(object)[0]];
}