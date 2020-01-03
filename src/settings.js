const {app} = require('electron');
const fs = require('fs');

const settingsFilePath = app.getPath('userData') + '/simple-scoreboard-matrix-settings.json';

let currentSettings = {
    lastLoadedFilePath: null,
};

const load = function () {
    if (false === fs.existsSync(settingsFilePath)) {
        return;
    }

    fs.readFile(settingsFilePath, 'utf8',  (err, fileContents) => {
        if (err) {
            throw err;
        }

        currentSettings = JSON.parse(fileContents);
    });
};

const save = function () {
    fs.writeFile(settingsFilePath, JSON.stringify(currentSettings), 'utf8',  (err) => {
        if (err) {
            throw err;
        }
    });
};

exports.get = function () { return currentSettings; };
exports.save = save;
exports.load = load;
