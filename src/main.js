// Modules to control application life and create native browser window
const {app, BrowserWindow, dialog, Menu} = require('electron');
const path = require('path');
const isMac = process.platform === 'darwin';
const http = require('http');
const fs = require('fs');
const lookup = require('mime-types').lookup;
const os = require('os');

const fileExport = require('./fileExport');
const data = require('./data');

const httpPort = 38480;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
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

let currentlyLoadedFile = null;

const apiHandler = function (url, req, res) {
    if (url === 'getData') {
        res.setHeader('content-type', 'application/json');
        res.write(JSON.stringify(data.getCurrentData()));
        res.end();
        return;
    } else if (url === 'setDataItem') {
        res.statusCode = 204;
        req.on('data', (d) => {
            const singleResult = JSON.parse(d);
            console.log(singleResult); // @TODO remove
            const currentResults = data.getCurrentDataResults();
            currentResults[singleResult.teamIdx]['' + (singleResult.gameIdx+1)] = singleResult.result;
            mainWindow.send('single-value-updated', singleResult.teamIdx, singleResult.gameIdx, singleResult.result);
        });
        res.end();
        return;
    }

    res.statusCode = 400;
    res.end();
};

const ipc = require('electron').ipcMain;

ipc.on('update-results', function (event, arg) {
    //win.webContents.send('targetPriceVal', arg)
    data.setCurrentDataResults(arg);

    if (null !== currentlyLoadedFile) {
        save(false);
    } else {
        mainWindow.send('not-saved-automatically', currentlyLoadedFile);
    }
});

ipc.on('export-csv', function (event, arg) {
    fileExport.csvResults(data.getCurrentData(), mainWindow);
});

ipc.on('export-ranking-csv', function (event, arg) {
    fileExport.csvRanking(data.getRanking(), mainWindow);
});

ipc.on('get-ip-addresses', function (event) {
    let addresses = [];
    const interfaces = os.networkInterfaces();

    Object.keys(interfaces).forEach(function (ifname) {
        interfaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family && 'IPv6' !== iface.family) {
                // skip over non-ipv4/ipv6 addresses
                return;
            }

            addresses.push({
                family: iface.family,
                address: iface.address,
                isLocal: iface.internal,
            });
        });
    });

    mainWindow.send('return-get-ip-addresses', httpPort, addresses);
});

ipc.on('show-ranking', function (event, arg) {
    mainWindow.send('return-show-ranking', data.getRanking());
});


// @TODO Put into own server.js ?

//create a server object:
http.createServer(function (req, res) {
    let url = req.url;
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
    } else if (url === '/semantic.css') {
        res.setHeader('content-type', 'text/css');
        res.write(fs.readFileSync(__dirname + '/../node_modules/semantic-ui-css/semantic.min.css'));
        res.end();
        return;
    } else if (url === '/semantic.js') {
        res.setHeader('content-type', 'application/javascript');
        res.write(fs.readFileSync(__dirname + '/../node_modules/semantic-ui-css/semantic.min.js'));
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
    const localFilePath = __dirname + '/../remote' + url;
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
}).listen(httpPort);


// application menu

const template = [
    // { role: 'appMenu' }
    ...(isMac ? [{
        label: app.name,
        submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideothers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
        ]
    }] : []),
    // { role: 'fileMenu' }
    {
        label: 'Datei',
        submenu: [
            {
                label: 'Neu',
                click: function () {
                    currentlyLoadedFile = null;
                    data.setCurrentData({ results: [] });
                    mainWindow.send('file-loaded', data.getCurrentData(), currentlyLoadedFile);
                },
            },
            {
                label: 'Öffnen...',
                click: function () {
                    const options = {
                        title: 'Spielstand laden',
                        //defaultPath: '/path/to/something/',
                        //buttonLabel: 'Do it',
                        filters: [
                          { name: 'json', extensions: ['json'] }
                        ],
                        //properties: ['showHiddenFiles'],
                        //message: 'This message will only be shown on macOS'
                    };

                    dialog.showOpenDialog(mainWindow, options, (filePaths) => {
                        if (undefined === filePaths || filePaths.length < 1) {
                            return;
                        }

                        fs.readFile(filePaths[0], 'utf8',  (err, fileContents) => {
                            if (err) {
                                throw err;
                            }

                            currentlyLoadedFile = filePaths[0];
                            data.setCurrentData(JSON.parse(fileContents));
                            mainWindow.send('file-loaded', data.getCurrentData(), currentlyLoadedFile);
                        });
                    });
                },
            },
            {
                label: 'Speichern',
                click: function () {
                    if (null === currentlyLoadedFile) {
                        saveAs();
                    } else {
                        save(true);
                    }
                },
            },
            {
                label: 'Speichern unter...',
                click: function () {
                    saveAs();
                },
            },
            { type: 'separator' },
            (isMac ? { label: 'Beenden', role: 'close' } : { label: 'Beenden', role: 'quit' }),
        ]
    },
    // { role: 'editMenu' }
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            ...(isMac ? [
                { role: 'pasteAndMatchStyle' },
                { role: 'delete' },
                { role: 'selectAll' },
                { type: 'separator' },
                {
                    label: 'Speech',
                    submenu: [
                        { role: 'startspeaking' },
                        { role: 'stopspeaking' }
                    ]
                }
            ] : [
                { role: 'delete' },
                { type: 'separator' },
                { role: 'selectAll' }
            ])
        ]
    },
    // { role: 'viewMenu' }
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { role: 'toggledevtools' },
            { type: 'separator' },
            { role: 'resetzoom' },
            { role: 'zoomin' },
            { role: 'zoomout' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    },
    // { role: 'windowMenu' }
    {
        label: 'Window',
        submenu: [
            { role: 'minimize' },
            { role: 'zoom' },
            ...(isMac ? [
                { type: 'separator' },
                { role: 'front' },
                { type: 'separator' },
                { role: 'window' }
            ] : [
                { role: 'close' }
            ])
        ]
    },
    /*
    {
        role: 'help',
        submenu: [
            {
                label: 'Learn More',
                click: async () => {
                    const { shell } = require('electron');
                    await shell.openExternal('https://electronjs.org');
                }
            }
        ]
    }
     */
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

const save = function (notify) {
    fs.writeFile(currentlyLoadedFile, JSON.stringify(data.getCurrentData()), 'utf8',  (err) => {
        if (err) {
            throw err;
        }

        if (true === notify) {
            mainWindow.send('file-saved', currentlyLoadedFile);
        }
    });
};

const saveAs = function () {
    const options = {
        title: 'Spielstand speichern',
        //defaultPath: '/path/to/something/',
        //buttonLabel: 'Do it',
        filters: [
            { name: 'json', extensions: ['json'] }
        ],
        //properties: ['showHiddenFiles'],
        //message: 'This message will only be shown on macOS'
    };

    dialog.showSaveDialog(mainWindow, options, (filePath) => {
        if (undefined === filePath) {
            return;
        }

        currentlyLoadedFile = filePath;
        save(true);
    });
};
