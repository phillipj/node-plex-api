var config = module.exports;

config["Plex API tests"] = {
	env: "node",
	rootPath: "../",
	sources: [
		"lib/api.js"
	],
	tests: [
		"test/*-test.js"
	]
};