// HTTP2
const
	http2 = require('spdy') // use spdy to support http2

function H2Ghost() {
	this.conf = require('./h2ghost.config.js')
	this.printConf = false
	this.headers = []

	this.setHeaders = function () {
		console.log('setHeaders')
		if (this.conf.optional.hpkp.length > 0)
			this.headers.push({ name: 'Public-Key-Pins', str: this.conf.optional.hpkp });
		if (this.conf.optional.hsts.length > 0)
			this.headers.push({ name: 'Strict-Transport-Security', str: this.conf.optional.hsts });
	}

	this.setEnv = function () {
		console.log('setEnv')

		// Set ENV
		// Ignore node version
		process.env.GHOST_NODE_VERSION_CHECK = false

		// Default to 'development' if !NODE_ENV
		if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development'

		// Config file override NODE_ENV
		if (this.conf.ghost.mode && this.conf.ghost.mode.length > 0)
			process.env.NODE_ENV = this.conf.ghost.mode

		// Cmd line override config file and NODE_ENV
		console.log(process.argv)

		process.argv.forEach(arg => {
			switch (arg.toLowerCase()) {
				case '--pro':
				case '--prd':
				case '--production':
					process.env.NODE_ENV = 'production'
					break
				case '--tes':
				case '--testing':
					process.env.NODE_ENV = 'testing'
					break
				case '--dev':
				case '--development':
					process.env.NODE_ENV = 'development'
					break
				case '--con':
				case '--config':
					this.printConf = true
					break
			}
		})

		this.conf.ghost.mode = process.env.NODE_ENV

	}

	// Config Ghost parameter used by H2Ghost
	this.setH2GhostParam = function () {
		console.log('setH2GhostParam')

		if (this.conf.ghost.start && this.conf.ghost.start.length > 0) {

			this.conf.ghost.start = this.conf.ghost.start.toLowerCase()
			if (this.conf.ghost.start === 'npm') {
				this.conf.ghost.dir = __dirname
				this.conf.ghost.npm = true
			} else if (this.conf.ghost.start === 'proxy') {
				this.conf.ghost.proxy = true
			}
			this.conf.ghost.start = this.conf.ghost.npm || this.conf.ghost.proxy

			// Confinue with auto config if `ghost.dir` is available
			if (this.conf.ghost.dir && this.conf.ghost.dir.length > 0) {
				const
					url = require('url').URL,
					path = require('path')

				this.conf.ghost.indexJs = path.join(this.conf.ghost.dir, 'index.js')

				console.log(this.conf.ghost)

				let
					conf = require(path.join(this.conf.ghost.dir, 'config.js'))[this.conf.ghost.mode],
					urlObj = new url(conf.url)

				this.conf.ghost.urlHost = urlObj.host
				this.conf.ghost.urlPort = (!urlObj.port || urlObj.port === '') ? 443 : urlObj.port

				// If using proxy, setup ghost server info
				if (this.conf.ghost.proxy)
					if (conf.server.host)
						this.conf.ghost.server = {
							host: conf.server.host,
							port: conf.server.port
						}
					else this.conf.ghost.server = { socketPath: conf.server.socket }
			}
		}
	}

	this.createProxyServer = function () {
		const proxy = require('http-proxy')
		options = {
			target: this.conf.ghost.server,
			xfwd: true
		}
		console.log('createProxyServer')
		return proxy.createProxyServer(options);
	}

	// Start H2 Server
	this.startH2Server = function () {
		let proxyServer;
		if (this.conf.ghost.proxy) proxyServer = this.createProxyServer()

		console.log('startH2Server')
		let h2server = http2.createServer(this.conf.h2Options, (req, res) => {

			this.headers.forEach((header) => res.setHeader(header.name, header.str))

			if (!this.conf.optional.httpsRedirect || req.headers.host === this.conf.ghost.urlHost) {
				if (this.conf.ghost.npm)
					this.conf.ghost.app(req, res)
				else
					proxyServer.web(req, res);
			}
			else {
				// HTTPS redirect
				res.writeHead(301, { 'location': `https://${this.conf.ghost.urlHost}${req.url}` });
				res.end()
			}

		}).listen(this.conf.ghost.urlPort, '0.0.0.0');

	}

	// Start Ghost
	this.startGhost = function () {
		if (this.conf.ghost.npm) {
			// Start Ghost Express App
			console.log(`startGhost: npm`)
			const
				ghost = require('./core'),
				ex = require('express')(),
				errors = require('./core/server/errors')

			ghost().then((ghostServer) => {
				ex.use(ghostServer.config.paths.subdir, ghostServer.rootApp);
				ghostServer.start(ex) // Cannot get rid of this :(
				this.conf.ghost.app = ghostServer.rootApp
			}).catch(function (err) {
				errors.logErrorAndExit(err, err.context, err.help);
			});
		}
		else {
			// Start Ghost Server
			console.log(`startGhost: ${this.conf.ghost.indexJs}`)
			require(this.conf.ghost.indexJs)
		}
	}

	this.startHttpRedirect = function () {
		console.log('startHttpRedirect')
		const http = require('http')
		let redirectCode = (this.conf.optional.httpRedirectPermanent) ? 308 : 307
		http.createServer((req, res) => {
			res.writeHead(redirectCode, { 'location': `https://${this.conf.ghost.urlHost}${req.url}` })
			res.end()
		}).listen(this.conf.optional.httpPort, '0.0.0.0');
	}

	this.start = function () {

		// Cluster??
		if (this.conf.cluster) {
			// Cluster
			const cluster = require('cluster');
			if (cluster.isMaster) {
				if (this.conf.ghost.start) this.startGhost()
				setTimeout(
					() => { for (let i = 0; i < this.conf.workers; i++)cluster.fork() },
					this.conf.startDelay * 1000)
			} else {
				// Start Server Worker
				this.startH2Server()
			}
		} else {
			// No Cluster
			if (this.conf.ghost.start) this.startGhost()
			setTimeout(() => this.startH2Server(), this.conf.startDelay * 1000);
		}

		// HTTP Server Redirect to HTTPS
		if (this.conf.optional.httpRedirect) {
			this.startHttpRedirect()
		};
	}

	this.printConfig = function () {
		if (this.printConf) console.log(this.conf)
	}

	// Constructor
	this.setEnv()
	this.setH2GhostParam()
	this.setHeaders()
	this.printConfig()
}

let h2ghost = new H2Ghost()
h2ghost.start()
