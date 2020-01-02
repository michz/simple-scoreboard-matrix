const {dialog} = require('electron');
const fs = require('fs');

const csvResults = function (currentData, mainWindow) {
    const options = {
        title: 'Spielstand als CSV exportieren',
        //defaultPath: '/path/to/something/',
        //buttonLabel: 'Do it',
        filters: [
            { name: 'csv', extensions: ['csv'] }
        ],
        //properties: ['showHiddenFiles'],
        //message: 'This message will only be shown on macOS'
    };

    dialog.showSaveDialog(mainWindow, options, (filePath) => {
        if (undefined === filePath) {
            return;
        }

        let output = '';
        for (let i = 0; i < currentData.results.length; i++) {
            const resultLine = currentData.results[i];
            let data = [];
            const keys = Object.keys(resultLine);

            data.push(resultLine.team);
            for (let j = 0; j < keys.length; j++) {
                const key = keys[j];
                if (false === isNaN(parseInt(key))) {
                    data.push(resultLine[key]);
                }
            }

            output += data.join(';') + "\n";
        }

        fs.writeFile(filePath, output, 'utf8',  (err) => {
            if (err) {
                throw err;
            }

            mainWindow.send('file-exported', filePath);
        });
    });
};

const csvRanking = function (ranking, mainWindow) {
    const options = {
        title: 'Rangliste als CSV exportieren',
        //defaultPath: '/path/to/something/',
        //buttonLabel: 'Do it',
        filters: [
            { name: 'csv', extensions: ['csv'] }
        ],
        //properties: ['showHiddenFiles'],
        //message: 'This message will only be shown on macOS'
    };

    dialog.showSaveDialog(mainWindow, options, (filePath) => {
        if (undefined === filePath) {
            return;
        }

        let output = '';
        for (let i = 0; i < ranking.length; i++) {
            const resultLine = ranking[i];

            output += Object.values(resultLine).join(';') + "\n";
        }

        fs.writeFile(filePath, output, 'utf8',  (err) => {
            if (err) {
                throw err;
            }

            mainWindow.send('file-exported', filePath);
        });
    });
};

exports.csvRanking = csvRanking;
exports.csvResults = csvResults;
