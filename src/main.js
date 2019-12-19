// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron');
const path = require('path');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'src/preload.js'),
            nodeIntegration: true,
        },
    });

    // and load the index.html of the app.
    mainWindow.loadFile('src/index.html');

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

var currentData = {
    results: [],
};

const apiHandler = function (url, req, res) {
    if (url === 'getData') {
        res.setHeader('content-type', 'application/json');
        res.write(JSON.stringify(currentData));
        res.end();
        return;
    }

    res.statusCode = 400;
    res.end();
};

const ipc = require('electron').ipcMain;

ipc.on('update-results', function (event, arg) {
    //win.webContents.send('targetPriceVal', arg)
    currentData.results = arg;
});


// @TODO Put into own server.js ?
const http = require('http');
const fs = require('fs');
const lookup = require('mime-types').lookup;

//create a server object:
http.createServer(function (req, res) {
    var url = req.url;
    if (url.startsWith('/api/')) {
        apiHandler(url.substr(5), req, res);
        return;
    } else if (url.endsWith('/')) {
        url += 'index.html';
    } else if (url === '/jquery.js') {
        res.setHeader('content-type', 'application/javascript');
        res.write(fs.readFileSync(__dirname + '/../node_modules/jquery/dist/jquery.min.js'));
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
    }

    // Make sure that there is not ".." in url (very rough input sanitizing)
    if (url.search(/\.\./) > -1) {
        res.statusCode = 400;
        res.end();
        return;
    }

    //var localFilePath = 'file://' + __dirname + '/remote' + url;
    var localFilePath = __dirname + '/../remote' + url;
    console.log(localFilePath);
    if (fs.existsSync(localFilePath)) {
        res.setHeader('content-type', lookup(localFilePath) || 'application/octet-stream');
        res.write(fs.readFileSync(localFilePath));
        res.end();
        return;
    }

    console.log('Not found: ' + req.url);

    // Do not know what to do with the request.
    res.statusCode = 404;
    res.end(); //end the response
}).listen(38480);
