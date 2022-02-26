'use strict';

const fs = require('fs');
const http = require('http');
const lookup = require('mime-types').lookup;

class HttpServer {
    httpPort: Number;
    apiHandlerCallback: CallableFunction;
    sse: any;

    constructor(
        httpPort,
        apiHandlerCallback,
        sse
    ) {
        this.httpPort = httpPort;
        this.apiHandlerCallback = apiHandlerCallback;
        this.sse = sse;
    }

    run(): void {
        var that: HttpServer = this;
        http.createServer(function (req, res) {
            let url = req.url;

            // Make sure that there is not ".." in url (very rough input sanitizing)
            if (url.search(/\.\./) > -1) {
                res.statusCode = 400;
                res.end();
                return;
            }

            if (url.startsWith('/api/')) {
                that.apiHandlerCallback(url.substr(5), req, res);
                return;
            } else if (url.startsWith('/sse')) {
                that.sse.init(req, res);
                return;
            } else if (url.endsWith('/')) {
                url += 'index.html';
            } else if (url === '/jquery.js') {
                res.setHeader('content-type', 'application/javascript');
                res.write(fs.readFileSync(__dirname + '/../node_modules/jquery/dist/jquery.min.js'));
                res.end();
                return;
            } else if (url === '/robots.txt') {
                res.setHeader('content-type', 'text/plain');
                res.write('Disallow: /');
                res.end();
                return;
            } else if (url === '/chart.js') {
                res.setHeader('content-type', 'application/javascript');
                res.write(fs.readFileSync(__dirname + '/../node_modules/chart.js/dist/Chart.min.js'));
                res.end();
                return;
            } else if (url === '/reset.css') {
                res.setHeader('content-type', 'text/css');
                res.write(fs.readFileSync(__dirname + '/../node_modules/modern-css-reset/dist/reset.min.css'));
                res.end();
                return;
            } else if (url === '/fomantic.css') {
                res.setHeader('content-type', 'text/css');
                res.write(fs.readFileSync(__dirname + '/../node_modules/fomantic-ui-css/semantic.min.css'));
                res.end();
                return;
            } else if (url === '/fomantic.js') {
                res.setHeader('content-type', 'application/javascript');
                res.write(fs.readFileSync(__dirname + '/../node_modules/fomantic-ui-css/semantic.min.js'));
                res.end();
                return;
            } else if (url === '/themes/default/assets/fonts/icons.woff2') {
                res.setHeader('content-type', 'font/woff2');
                res.write(fs.readFileSync(__dirname + '/../node_modules/fomantic-ui-css/themes/default/assets/fonts/icons.woff2'));
                res.end();
                return;
            }

            //var localFilePath = 'file://' + __dirname + '/remote' + url;
            const localFilePath = __dirname + '/../wwwsrc' + url;
            if (fs.existsSync(localFilePath)) {
                res.setHeader('content-type', lookup(localFilePath) || 'application/octet-stream');
                res.write(fs.readFileSync(localFilePath));
                res.end();
                return;
            } else if (url.search(/^\/node_modules\//) > -1) {
                const localNodeModulesFilePath = __dirname + '/..' + url;
                if (fs.existsSync(localNodeModulesFilePath)) {
                    res.setHeader('content-type', lookup(localNodeModulesFilePath) || 'application/octet-stream');
                    res.write(fs.readFileSync(localNodeModulesFilePath));
                    res.end();
                    return;
                }
            }

            // @TODO REMOVE legacy code
            const localLegacyFilePath = __dirname + '/../remote' + url;
            if (fs.existsSync(localLegacyFilePath)) {
                res.setHeader('content-type', lookup(localLegacyFilePath) || 'application/octet-stream');
                res.write(fs.readFileSync(localLegacyFilePath));
                res.end();
                return;
            }

            console.log('Not found: ' + req.url);

            // Do not know what to do with the request.
            res.statusCode = 404;
            res.end(); // (s)end the response
        })
            .listen(this.httpPort);
    }
}

export default HttpServer;
