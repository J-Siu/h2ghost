// HTTPS

const fs = require('fs');
const url = require('url');
const http = require('http');
const https = require('https');
const proxy = require('http-proxy').createProxyServer();

// Fill in your certificate files
const serverKey='';
const serverCrt='';
const serverCa='';

const httpsOptions = {
	key: fs.readFileSync(serverKey),
	cert: fs.readFileSync(serverCrt),
	ca: fs.readFileSync(serverCa),
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

// HTTP Redirect to HTTPS

http.createServer(function (req, res) {
	res.writeHead(301, { "location": "https://johnsiu.com" + req.url });
	res.end();
}).listen(80, '0.0.0.0');

// Ghost Proxy configuration

proxy.on('proxyReq', function (proxyReq, req, res, options) {

	// Ngix: proxy_set_header Host $http_host;
	proxyReq.setHeader('Host', req.headers.host);

	// Ngix: proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	proxyReq.setHeader('X-Forwarded-For', req.connection.remoteAddress);

	// Ngix: proxy_set_header X-Forwarded-Proto $scheme;
	proxyReq.setHeader('X-Forwarded-Proto', 'https');

});

// HTTPS Proxy

https.createServer(httpsOptions, (req, res) => {
	proxy.web(req, res, { target: 'http://localhost:2368' })
}).listen(443, '0.0.0.0');
