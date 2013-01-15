var config = module.exports;

config["Plex API tests"] = {
	env: "node",
	rootPath: "../",
	sources: [
		"index.js"
	],
	tests: [
		"test/*-test.js"
	]
};