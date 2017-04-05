// HTTP2
const
	http2 = require('spdy'), // use spdy to support http2
	express = require('express'),
	proxy = require('http-proxy'),
	cluster = require('cluster')

function H2Ghost() {
	this.conf = require('./h2ghost.config.js')
	this.printConf = false

	// Set ENV
	this.setEnv = function () {
		console.log('setEnv')

		// Ignore node version
		process.env.GHOST_NODE_VERSION_CHECK = false

		// Default to 'development' if !NODE_ENV
		if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development'

		// Config file override NODE_ENV
		if (this.conf.ghost.env && this.conf.ghost.env.length > 0)
			process.env.NODE_ENV = this.conf.ghost.env

		// Cmd line override config file and NODE_ENV
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

		this.conf.ghost.env = process.env.NODE_ENV

	}

	// Config Ghost parameter used by H2Ghost
	this.setH2GhostParam = function () {
		console.log('setH2GhostParam')

		let tcg = this.conf.ghost	// use short hand

		if (tcg.dir === './') tcg.dir = __dirname

		// Are we starting Ghost? Which mode?
		if (tcg.start && tcg.start.length > 0) {
			tcg.start = tcg.start.toLowerCase()
			if (tcg.start === 'app')
				tcg.app = true
			else if (tcg.start === 'proxy')
				tcg.proxy = true
			tcg.start = tcg.app || tcg.proxy
		}

		// Confinue with auto config if `ghost.dir` is available
		let url = require('url').URL
		if (tcg.dir && tcg.dir.length > 0) {
			let
				path = require('path'),
				conf = require(path.join(tcg.dir, 'config.js'))[tcg.env],
				urlObj = new url(conf.url)

			tcg.urlHost = urlObj.host
			tcg.urlPort = (!urlObj.port || urlObj.port === '') ? 443 : urlObj.port

			// If using proxy, setup ghost server info
			if (conf.server.host)
				tcg.server = {
					host: conf.server.host,
					port: conf.server.port
				}
			else tcg.server = { socketPath: conf.server.socket.path }
		} else {
			// Manual config
			let
				urlObj = new url(tcg.url)

			tcg.urlHost = urlObj.host
			tcg.urlPort = (!urlObj.port || urlObj.port === '') ? 443 : urlObj.port
		}

		// Set h2 server startDelay in ms
		this.conf.startDelay = (tcg.server.socket && tcg.start != app) ? 20 * 1000 : 0
	}

	// Start Ghost
	this.startGhost = function (ex) {
		console.log('startGhost: Starting')

		let
			app = (ex) ? ex : express(),
			ghost = require(`${this.conf.ghost.dir}/core`),
			errors = require(`${this.conf.ghost.dir}/core/server/errors`)

		ghost().then((ghostServer) => {
			console.log(`startGhost: Done`)
			app.use(ghostServer.config.paths.subdir, ghostServer.rootApp)
			ghostServer.start(app) // Cannot get rid of this
		}).catch(function (err) {
			errors.logErrorAndExit(err, err.context, err.help)
		})
	}

	// Create http-proxy if proxy mode is used
	this.startProxy = function (ex) {
		console.log('startProxy')
		options = {
			target: this.conf.ghost.server,
			xfwd: true
		}
		let px = proxy.createProxyServer(options)
		ex.all('*', (req, res) => px.web(req, res))
	}

	/* startExpress

	*/
	this.startExpress = function () {

		console.log('startExpress')

		let ex = express()

		// HTTPS redirect
		if (this.conf.optional.httpsRedirect) {
			let redirectCode = (this.conf.optional.httpRedirectPermanent) ? 308 : 307
			ex.all('*', (req, res, next) => {
				if (req.headers.host != this.conf.ghost.urlHost) {
					res.writeHead(redirectCode, { 'location': `https://${this.conf.ghost.urlHost}${req.url}` });
					res.end()
				} else next()
			})
		}

		// Mount APP or Proxy
		if (this.conf.ghost.app)
			this.startGhost(ex)
		else
			this.startProxy(ex)

		return ex
	}

	// Start H2 Server
	this.startH2Server = function () {
		console.log('startH2Server')
		let ex = this.startExpress()
		http2.createServer(this.conf.h2Options, ex)
			.listen(this.conf.ghost.urlPort, '0.0.0.0');
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
		if (this.conf.optional.cluster) {
			// Cluster
			console.log('Cluster')
			if (cluster.isMaster) {
				console.log('Cluster:Master')
				if (this.conf.ghost.proxy) this.startGhost()
				setTimeout(() => {
					for (let i = 0; i < this.conf.optional.workers; i++) {
						console.log(i)
						cluster.fork()
					}
				}, this.conf.startDelay)
				// HTTP Server Redirect to HTTPS
				if (this.conf.optional.httpRedirect) this.startHttpRedirect()
			} else {
				// Start Server Worker
				// startH2Server -> startExpress -> startProxy
				console.log('Cluster:Worker')
				this.startH2Server()
			}
		} else {
			if (this.conf.ghost.app)
				// startH2Server -> startExpress -> startGhost(ex)
				this.startH2Server()
			else {
				if (this.conf.ghost.proxy) this.startGhost()
				// startH2Server -> startExpress -> startProxy
				setTimeout(() => this.startH2Server(), this.conf.startDelay)
			}
			// HTTP Server Redirect to HTTPS
			if (this.conf.optional.httpRedirect) this.startHttpRedirect()
		}
	}

	// Constructor
	this.setEnv()
	this.setH2GhostParam()
	if (this.printConf) console.log(this.conf)
}

let h2ghost = new H2Ghost()
h2ghost.start()
