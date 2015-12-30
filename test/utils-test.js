var expect = require('expect.js');

var PlexAPI = require('..');

describe('_serverScheme', function() {
    it('should use http by default', function() {
        var api = new PlexAPI({hostname: 'localhost'});
        expect(api._serverScheme()).to.equal('http://');
    });
    it('should use https when port 443 is specified', function() {
        var api = new PlexAPI({hostname: 'localhost', port: 443});
        expect(api._serverScheme()).to.equal('https://');
    });
    it('should use https when the https parameter is true', function() {
        var api = new PlexAPI({hostname: 'localhost', https: true});
        expect(api._serverScheme()).to.equal('https://');
    });
});