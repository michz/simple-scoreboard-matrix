//$('#scoreBoardTitle').html('TEST');

const electron = require('electron');
const ipc = electron.ipcRenderer;

var countColumns = function () {
    return $('#scoreBoardHead tr:first th').length - 2;
};

var addRow = function (skipValueChangedHandler) {
    var rowContent = '';
    var columnCount = countColumns();
    for (var i = 0; i < columnCount; i++) {
        rowContent += '<td><input class="result"></td>';
    }

    var row = '<tr>' +
        '<td class="row-header"><span class="delete-row"><i class="icon trash"></i></span><input class="teamName" value="Team"></td>' +
        rowContent +
        '<td class="sum"></td>' +
        '</tr>';

    $('#scoreBoardBody').append(row);

    if (undefined === skipValueChangedHandler || true !== skipValueChangedHandler) {
        valueChanged();
    }
};

var addColumn = function (skipValueChangedHandler) {
    var column = '<td><input class="result"></td>';
    $('#scoreBoardHead tr th:last').before('<th class="result-header"><span class="column-number">' + (countColumns() + 1) + '</span><span class="delete-column"><i class="icon trash"></i></span></th>');

    $('#scoreBoardBody tr').each(function (idx, element) {
        $(element).find('td:last').before(column);
    });

    if (undefined === skipValueChangedHandler || true !== skipValueChangedHandler) {
        valueChanged();
    }
};

var deleteRow = function (e) {
    var that = this;
    showConfirmModal(
        'Soll die Zeile wirklich gelöscht werden? Dabei werden auch sämtliche Ergebnisse dieser Zeile gelöscht. Dieser Vorgang kann nicht rückgängig gemacht werden!',
        function () {
            // Get index of selected row: $('#scoreBoardBody tr').index($(this).closest('tr'));
            $(that).closest('tr').remove();
            valueChanged();
        }
    );
};

var deleteColumn = function (e) {
    var that = this;
    showConfirmModal(
        'Soll die Spalte wirklich gelöscht werden? Dabei werden auch sämtliche Ergebnisse dieser Spalte gelöscht. Dieser Vorgang kann nicht rückgängig gemacht werden!',
        function () {
            var index = $('#scoreBoardHead th').index($(that).closest('th'));
            //var currentColumnCount = countColumns();
            var countRows = $('#scoreBoardBody tr').length;

            // remove header
            $(that).closest('th').remove();

            // Delete the results of the current column
            for (var j = 0; j < countRows; j++) {
                $('#scoreBoardBody tr').eq(j).find('.result').eq(index-1).closest('td').remove();
            }

            // renumber headers
            $('#scoreBoardHead th').each(function (idx, element) {
                if (0 === idx) {
                    return;
                }

                $(element).find('.column-number').text(idx);
            });

            valueChanged();
        }
    );
};

var showConfirmModal = function (text, yesCallback, noCallback) {
    $('#confirm-modal .content').html(text);
    $('#confirm-modal').modal({
        closable: false,
        onDeny: noCallback,
        onApprove: yesCallback,
    });

    $('#confirm-modal').modal('show');
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

var valueChanged = function () {
    updateSums();
    ipc.send('update-results', getResults());
};

var resetScoreboard = function () {
    $('#scoreBoardBody').html('');
    $('#scoreBoardHead .result-header').remove();
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

$('#scoreBoard').on('click', '.delete-row', deleteRow);
$('#scoreBoard').on('click', '.delete-column', deleteColumn);
$('#scoreBoard').on('change', 'input', valueChanged);


// Open all "external links" in system's browser
$('.external-link').on('click', function (e) {
    e.preventDefault();

    const { shell } = require('electron');
    shell.openExternal($(this).prop('href'));

    return false;
});


ipc.on('not-saved-automatically', function (sender) {
    toastr.warning(
        'Speichere den Spielstand einmal manuell, damit das automatische Speichern funktioniert',
        'Nicht automatisch gespeichert'
    );
});

ipc.on('file-loaded', function (sender, data, filePath) {
    if (data.results === undefined) {
        throw new Error('Dateiformat unbekannt');
    }

    var results = data.results;
    var countRows = results.length;

    // clear current rows and columns
    resetScoreboard();

    // Get (max) number of columns
    var countColumns = 0;
    for (var i = 0; i < countRows; i++) {
        countColumns = Math.max(countColumns, Object.keys(results[i]).length - 2);
    }

    for (var i = 0; i < countRows; i++) {
        addRow(true);
    }

    for (var i = 0; i < countColumns; i++) {
        addColumn(true);
    }

    for (var i = 0; i < countRows; i++) {
        var rowData = results[i];
        var row = $('#scoreBoardBody tr').eq(i);
        var columnCount = Object.keys(rowData).length - 2;

        row.find('.teamName').val(rowData.team);
        for (var j = 0; j <= columnCount; j++) {
            row.find('.result').eq(j-1).val(rowData['' + j]);
        }
    }

    updateSums();
});

ipc.on('file-saved', function (sender, filePath) {
    toastr.success('Ergebnisse wurden gespeichert');
});


// Start without loaded data
updateSums();


toastr.options.positionClass = 'toast-bottom-right';
toastr.options.timeOut = 1000;            // How long the toast will display without user interaction
toastr.options.extendedTimeOut = 5000;    // How long the toast will display after a user hovers over it


/*
TODO:
* Sortieren
 */
