// HTTP2

const fs = require('fs');
const url = require('url');
const http = require('http');
const https = require('spdy');
const proxy = require('http-proxy').createProxyServer();
const compression = require('compression');
const ex = require('express')();
const fqdn = '<your domain name>';

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

// Ghost Proxy configuration

proxy.on('proxyReq', function (proxyReq, req, res, options) {

	// Ngix: proxy_set_header Host $http_host;
	proxyReq.setHeader('Host', req.headers.host);

	// Ngix: proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	proxyReq.setHeader('X-Forwarded-For', req.connection.remoteAddress);

	// Ngix: proxy_set_header X-Forwarded-Proto $scheme;
	proxyReq.setHeader('X-Forwarded-Proto', 'https');

});

ex
	.use(compression())
	.use((req, res) => {
		if (req.header.host == fqdn) {
			proxy.web(req, res, { target: 'http://localhost:2368' });
		} else {
			res.writeHead(301, { 'location': 'https://' + fqdn + req.url });
			res.end();
		}
	})

// HTTPS Server

https.createServer(httpsOptions, ex).listen(443, '0.0.0.0');

// HTTP Server Redirect to HTTPS

http.createServer(function (req, res) {
	res.writeHead(301, { 'location': 'https://' + fqdn + req.url });
	res.end();
}).listen(80, '0.0.0.0');
