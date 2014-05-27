exports.attach = function(url) {
	return function resolveAndAttachUris(result) {
		var childType;
		var resolver;

		for (childType in result) {
			if (!result.hasOwnProperty(childType)) { continue; }
			if (resolver = uriResolvers[childType]) {
				resolver(url, result[childType]);
			}
		}

		return result;
	};
};


var uriResolvers = {
	directory: function(url, directories) {
		directories.forEach(function(directory) {
			var parentUrl = url;
			if (parentUrl[parentUrl.length - 1] !== "/") {
				parentUrl += "/";
			}

			directory.uri = parentUrl + directory.attributes.key;
		});
	},

	server: function(url, servers) {
		servers.forEach(function(server) {
			server.uri = "/system/players/" + server.attributes.address;
		});
	}
};