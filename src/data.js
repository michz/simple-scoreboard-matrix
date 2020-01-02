
let currentData = {
    results: [],
};

const getCurrentData = function () {
    return currentData;
};

const getCurrentDataResults = function () {
    return currentData.results;
};

const setCurrentData = function (data) {
    currentData = data;
};

const setCurrentDataResults = function (results) {
    currentData.results = results;
};

const getRanking = function () {
    let results = [];
    let copiedData = JSON.parse(JSON.stringify(currentData.results));
    copiedData.sort((a, b) => (parseFloat(a.sum) < parseFloat(b.sum)) ? 1 : -1);

    let rank = 0;
    let lastSum = 0;
    for (let i = 0; i < copiedData.length; i++) {
        let result = copiedData[i];

        if (result.sum !== lastSum) {
            rank++;
        }

        results.push({
            rank: rank,
            team: result.team,
            sum: result.sum,
        });

        lastSum = result.sum;
    }

    return results;
};



exports.getCurrentData = getCurrentData;
exports.getCurrentDataResults = getCurrentDataResults;
exports.setCurrentData = setCurrentData;
exports.setCurrentDataResults = setCurrentDataResults;
exports.getRanking = getRanking;
