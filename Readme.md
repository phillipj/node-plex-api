# plex-api [![Build Status](https://api.travis-ci.org/phillipj/node-plex-api.png?branch=master)](http://travis-ci.org/phillipj/node-plex-api)

Small module which helps you query the Plex Media Server HTTP API.

## Usage

```bash
$ npm install plex-api --save
```

**PlexAPI(options | hostname)**

Instantiate a PlexAPI client.

The parameter can be a string representing the server's hostname, or an object with the following properties:

Options:
- **hostname**: hostname where Plex Server runs
- **port**: port number Plex Server is listening on (optional, default: `32400`)
- **https**: (optional, default: `false`)
- **username**: plex.tv username (optional / required for PlexHome)
- **password**: plex.tv password (optional / required for PlexHome)
- **managedUser**: details required to perform operations as a managed PlexHome user
	- **name**: managed user name
	- **pin**: optional pin code for the managed user
- **token**: plex.tv authentication token (optional)
- **timeout**: timeout value in milliseconds to use when making requests (optional)
- **options**: override additional PlexHome options (optional, but recommended for PlexHome)
	- **identifier**: A unique client identifier. Default is a `generated uuid v4`. *Note: you should really provide this rather than let it get generated. Every time your app runs, a new "device" will get registered on your Plex account, which can lead to poor performance once hundreds or thousands of them get created. Trust me!*
	- **product**: The name of your application. Official Plex examples: `Plex Web`, `Plex Home Theater`, `Plex for Xbox One`. Default `Node.js App`
	- **version**: The version of your app. Default `1.0`
	- **deviceName**: The "name" of the device your app is running on. For apps like Plex Home Theater and mobile apps, it's the computer or phone's name chosen by the user. Default `Node.js App`
	- **platform**: The platform your app is running on. The use of this is inconsistent in the official Plex apps. It is not displayed on the web interface. Official Plex examples: `Chrome`, `Plex Home Theater`, `Windows`. Default is `Node.js`.
	- **platformVersion**: The platform version. Default is the version of Node running.
	- **device**: The name of the type of computer your app is running on, usually the OS name. Official Plex examples: `Windows`, `iPhone`, `Xbox One`. Default is whatever `os.platform()` returns.

Here's an example of what an app shows up as on the Plex web interface

![Plex Device Example](docs/plex-device-example.png?raw)

The rows in that example from top to bottom are `deviceName`, `version`, `product`, and `device`.

### .query(options)

**Retrieve content from URI**

The parameter can be a string representing the URI, or an object with the following properties:
- **uri**: the URI to query
- (optional) **extraHeaders**: an object with extra headers to send in the HTTP request. Useful for things like X-Plex-Target-Client-Identifier

Aside from requesting the API and returning its response, an `.uri` property are created to easier follow the URIs available in the HTTP API. At the moment URIs are attached for Directory and Server items.

```js
var PlexAPI = require("plex-api");
var client = new PlexAPI("192.168.0.1");

client.query("/").then(function (result) {
	console.log("%s running Plex Media Server v%s",
		result.friendlyName,
		result.version);

	// array of children, such as Directory or Server items
	// will have the .uri-property attached
	console.log(result._children);
}, function (err) {
	console.error("Could not connect to server", err);
});
```

### .postQuery(options)

**Send a POST request and retrieve the response**

This is identical to `query()`, except that the request will be a POST rather than a GET. It has the same required and optional parameters as `query()`.

Note that the parameters can only be passed as a query string as part of the uri, which is all Plex requires. (`Content-Length` will always be zero)

```js
var PlexAPI = require("plex-api");
var client = new PlexAPI("192.168.0.1");

client.postQuery("/playQueue?type=video&uri=someuri&shuffle=0").then(function (result) {
	console.log("Added video to playQueue %s",
		result.playQueueID);

	// array of children, such as Directory or Server items
	// will have the .uri-property attached
	console.log(result._children);
}, function (err) {
	console.error("Could not connect to server", err);
});
```

### .putQuery(options)

**Send a PUT request and retrieve the response**

This is identical to `query()`, except that the request will be a PUT rather than a GET. It has the same required and optional parameters as `query()`. It's is used to update parts of your Plex library.

Note that the parameters can only be passed as a query string as part of the uri, which is all Plex requires. (`Content-Length` will always be zero)

```js
var PlexAPI = require("plex-api");
var client = new PlexAPI("192.168.0.1");

client.putQuery("/library/sections/3/all?type=1&id=123&summary.value=updatedSummaryText")
	.then(function (result) {
		console.log("Description of video by id 123 has been set to 'updatedSummaryText'");
	}, function (err) {
		console.error("Could not connect to server", err);
	});
```

### .perform(options)

**Perform an API action**

When performing an "action" on the HTTP API, the response body will be empty.
As the response content itself is worthless, `perform()` acts on the HTTP status codes the server responds with.
It has the same required and optional parameters as `query()`.

```js
var PlexAPI = require("plex-api");
var client = new PlexAPI("192.168.0.1");

// update library section of key "1"
client.perform("/library/sections/1/refresh").then(function () {
	// successfully started to refresh library section #1
}, function (err) {
	console.error("Could not connect to server", err);
});
```

### .find(options, [{criterias}])

**Find matching child items on URI**

Uses `query()` behind the scenes, giving all directories and servers the beloved `.uri` property. It has the same required and optional parameters as `query`, in addition to a second optional `criterias` parameter.

```js
var PlexAPI = require("plex-api");
var client = new PlexAPI("192.168.0.1");

// filter directories on Directory attributes
client.find("/library/sections", {type: "movie"}).then(function (directories) {
	// directories would be an array of sections whose type are "movie"
}, function (err) {
	console.error("Could not connect to server", err);
});

// criterias are interpreted as regular expressions
client.find("/library/sections", {type: "movie|shows"}).then(function (directories) {
	// directories type would be "movie" OR "shows"
}, function (err) {
	console.error("Could not connect to server", err);
});

// shorthand to retrieve all Directories
client.find("/").then(function (directories) {
	// directories would be an array of Directory items
}, function (err) {
	throw new Error("Could not connect to server");
});
```

## Authenticators

An authenticator is used by plex-api to authenticate its request against Plex Servers with a PlexHome setup. The most common authentication mechanism is by username and password.

You can provide your own custom authentication mechanism, read more about custom authenticators below.

### Credentials: username and password

Comes bundled with plex-api. Just provide `options.username` and `options.password` when creating a PlexAPI instance and you are good to go.

See the [plex-api-credentials](https://www.npmjs.com/package/plex-api-credentials) module for more information about its inner workings.

### PIN: authenticate by PIN code

An authentication module that provides an interface for authenticating with Plex using a PIN, like the official clients do.

https://www.npmjs.com/package/plex-api-pinauth

### Custom authenticator

In its simplest form an `authenticator` is an object with **one required** function `authenticate()` which should return the autentication token needed by plex-api to satisfy Plex Server.

An optional method `initialize()` could be implemented if you need reference to the created PlexAPI instance when it's created.

```js
{
  // OPTIONAL
  initialize: function(plexApi) {
    // plexApi === the PlexAPI instance just created
  },
  // REQUIRED
  authenticate: function(plexApi, callback) {
    // plexApi === the PlexAPI instance requesting the authentication token

    // invoke callback if something fails
    if (somethingFailed) {
      return callback(new Error('I haz no cluez about token!'));
    }

    // or when you have a token
    callback(null, 'I-found-this-token');
  }
}
```

## HTTP API Documentation
For more information about the API capabilities, see the [unofficial Plex API documentation](https://github.com/Arcanemagus/plex-api/wiki). The [PlexInc's desktop client wiki](https://github.com/plexinc/plex-media-player/wiki/Remote-control-API) might also be valueable.

## Running tests

```shell
$ npm install
$ npm test
```

Automatically run all tests whenever files has been changed:
```shell
$ npm run test:watch
```

## Usage in the wild

plex-api has proven to be useful in more than one project over the years.

Do you have project which uses plex-api? Please tell us about it and we'll list it here :)

### alexa-plex

Alexa (Amazon Echo) app for interacting with a Plex Server and controlling client playback.

https://github.com/OverloadUT/alexa-plex by [@OverloadUT](https://github.com/OverloadUT).

### nl.kikkert.plex

The Plex Remote control app for the Homey device.

https://github.com/MikeOne/nl.kikkert.plex by [@MikeOne](https://github.com/MikeOne).

## Contributing

Contributions are more than welcome! Create an issue describing what you want to do. If that feature is seen to fit this project, send a pull request with the changes accompanied by tests.

## License
(The MIT License)

Copyright (c) 2013-2016 Phillip Johnsen &lt;johphi@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
