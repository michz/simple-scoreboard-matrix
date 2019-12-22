//$('#scoreBoardTitle').html('TEST');

const electron = require('electron');
const ipc = electron.ipcRenderer;

var teams = [];

var countColumns = function () {
    return $('#scoreBoardHead tr:first th').length - 2;
};

var addRow = function () {
    var rowContent = '';
    var columnCount = countColumns();
    for (var i = 0; i < columnCount; i++) {
        rowContent += '<td><input class="result"></td>';
    }

    var row = '<tr>' +
        '<td class="row-header"><input class="teamName" value="Team"></td>' +
        rowContent +
        '<td class="sum"></td>' +
        '</tr>';

    $('#scoreBoardBody').append(row);
};

var addColumn = function () {
    var column = '<td><input class="result"></td>';
    $('#scoreBoardHead tr th:last').before('<th>' + (countColumns() + 1) + '</th>');

    $('#scoreBoardBody tr').each(function (idx, element) {
        $(element).find('td:last').before(column);
    });
};

var updateSums = function () {
    $('#scoreBoardBody tr').each(function (idx, element) {
        var sum = 0;
        $(element).find('.result').each(function (idx, resultElement) {
            var value = parseFloat($(resultElement).val());
            if (false === isNaN(value))  {
                sum += value;
            }
        });
        $(element).find('.sum').text(sum);
    });
};

var valueChanged = function (e) {
    updateSums();
    ipc.send('update-results', getResults());
};

var getResults = function () {
    var results = [];

    $('#scoreBoardBody tr').each(function (idx, element) {
        var resultRow = {};
        var i = 1;
        resultRow.team = $(element).find('.teamName').val();

        $(element).find('.result').each(function (idx, resultElement) {
            resultRow[i.toString()] = $(resultElement).val();
            i++;
        });

        resultRow.sum = $(element).find('.sum').text();

        results.push(resultRow);
    });

    return results;
};


$('#btnAddRow').on('click', addRow);
$('#btnAddColumn').on('click', addColumn);

$('#scoreBoard').on('change', 'input', valueChanged);

$('.external-link').on('click', function (e) {
    e.preventDefault();

    const { shell } = require('electron');
    shell.openExternal($(this).prop('href'));

    return false;
});

// Start without loaded data


addColumn();
addColumn();
addColumn();
addColumn();
addRow();
addRow();

updateSums();


/*
TODO:
* Sortieren
* Daten mit Backend austauschen
 */
