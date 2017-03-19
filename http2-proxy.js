// HTTP2
const proxyConfig = require('./http2-proxy.config.js');
const url = require('url');
const http = require('http');
const http2 = require('spdy'); // use spdy to support http2
const proxy = require('http-proxy');

function startProxy() {

	var px = proxy.createProxyServer(proxyConfig.proxyOptions);

	if (!proxyConfig.httpsRedirect) {

		// No Https URLs Redirect
		http2
			.createServer(proxyConfig.httpsOptions, (req, res) => px.web(req, res))
			.listen(proxyConfig.httpsPort, '0.0.0.0');

	} else {

		// Https URLs Redirect
		http2
			.createServer(proxyConfig.httpsOptions, (req, res) => {
				if (req.headers.host == proxyConfig.url) {
					px.web(req, res);
				} else {
					res.writeHead(301, { 'location': 'https://' + proxyConfig.url + req.url });
					res.end();
				}
			})
			.listen(proxyConfig.httpsPort, '0.0.0.0');

	}

	if (proxyConfig.httpRedirect) {
		// HTTP Server Redirect to HTTPS
		http.createServer(function (req, res) {
			res.writeHead(301, { 'location': 'https://' + proxyConfig.url + req.url });
			res.end();
		}).listen(proxyConfig.httpPort, '0.0.0.0');
	};

}

if (!proxyConfig.cluster) {
	startProxy();
} else {
	// Cluster
	const cluster = require('cluster');
	if (cluster.isMaster) {
		for (var i = 0; i < proxyConfig.workers; i++) {
			cluster.fork();
		}
	} else {
		startProxy();
	}
}
