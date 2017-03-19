// Fill in your certificate files
const serverKey = '';
const serverCrt = '';
// Uncomment following line to use CA file.
//const serverCa = '';

// The primay url of the site.
exports.url = 'example.com';

const ghost = {
	// Uncomment and modify following section if Ghost use ip address.
	/*
	host: '127.0.0.1',
	port: 2368
	*/

	// Uncomment and modify following section if Ghost use unix socket.
	/*
	socketPath: './ghost.sock'
	*/
};

// HTTP to HTTPS redirect, eg. http://example.com -> https://example.com
exports.httpRedirect = true;
exports.httpPort = 80;

// HTTPS url redirect, eg. https://www.<url> -> https://<url>
// 	This is only useful if your certificate support all
// 	the domains/sub-domains pointing to this site.
exports.httpsRedirect = true;
exports.httpsPort = 443;

// Cluster
exports.cluster = false;
exports.workers = 4;

const fs = require('fs');

exports.httpsOptions = {
	key: fs.readFileSync(serverKey),
	cert: fs.readFileSync(serverCrt),
	// ca: fs.readFileSync(serverCa), // Uncomment this line to use CA file
	ciphers: [
		"ECDHE-RSA-AES256-SHA384",
		"DHE-RSA-AES256-SHA384",
		"ECDHE-RSA-AES256-SHA256",
		"DHE-RSA-AES256-SHA256",
		"ECDHE-RSA-AES128-SHA256",
		"DHE-RSA-AES128-SHA256",
		"HIGH",
		"!aNULL",
		"!eNULL",
		"!EXPORT",
		"!DES",
		"!RC4",
		"!MD5",
		"!PSK",
		"!SRP",
		"!CAMELLIA"
	].join(':'),
};

exports.proxyOptions = {
	target: ghost,
	xfwd: true
};
