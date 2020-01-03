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

var triggerExportCsv = function () {
    ipc.send('export-csv', getResults());
};

var triggerExportRankingCsv = function () {
    ipc.send('export-ranking-csv');
};

var showRemoteModal = function () {
    ipc.send('get-ip-addresses');
};

var showRanking = function () {
    ipc.send('show-ranking');
};

ipc.on('return-get-ip-addresses', function (sender, port, addresses) {
    var getUrl = function (address) {
        var url = 'http://';
        if ('IPv4' === address.family) {
            url += address.address;
        } else if ('IPv6' === address.family) {
            url += '[' + address.address + ']';
        }

        if (port !== 80) {
            url += ':' + port;
        }

        return url;
    };

    var content = '';
    for (var i = 0; i < addresses.length; i++) {
        var address = addresses[i];
        var url = getUrl(address);
        content += '<li class="' + address.family + ' ' + (address.isLocal ? 'local' : '') + '"><a class="external-link" href="' + url + '">' + url + '</a></li>' + "\n";
    }
    $('#remote-info-modal .content-addresses').html(content);

    $('#remote-info-modal').modal({
        closable: true,
    });

    $('#remote-info-modal').modal('show');
});

ipc.on('return-show-ranking', function (sender, ranking) {
    $('.ranking-content').html('');
    for (var i = 0; i < ranking.length; i++) {
        var result = ranking[i];

        $('.ranking-content').append(
            '<tr><td class="rank">' + result.rank + '</td><td class="teamName">' + result.team + '</td><td class="sum">' + result.sum + '</td></tr>'
        );
    }

    $('#ranking-modal').modal('show');
});

$('#btnAddRow').on('click', addRow);
$('#btnAddColumn').on('click', addColumn);
$('#btnExportCSV').on('click', triggerExportCsv);
$('#btnExportRankingCSV').on('click', triggerExportRankingCsv);
$('#btnShowRemote').on('click', showRemoteModal);
$('#btnShowRanking').on('click', showRanking);

$('#scoreBoard').on('click', '.delete-row', deleteRow);
$('#scoreBoard').on('click', '.delete-column', deleteColumn);
$('#scoreBoard').on('change', 'input', valueChanged);

$('#scoreBoardBody').on('keyup', 'input', function (e) {
    if ($(this).is(":focus") && (13 === e.keyCode)) {
        var row = $(this).closest('tr');
        var cell = $(this).closest('td');
        var nextRow = $(row).next('tr');
        var index = $('td', row).index(cell);
        var nextInput = $('td', nextRow).eq(index).find('input');

        if (nextInput.length <= 0) {
            nextInput = $('#scoreBoardBody tr:first td').eq(index+1).find('input');
        }

        if (nextInput.length <= 0) {
            nextInput = $('#scoreBoardBody tr:first td:first').find('input');
        }

        nextInput.focus();
    }
});


// Open all "external links" in system's browser
$(document).on('click', '.external-link', function (e) {
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

ipc.on('file-exported', function (sender, filePath) {
    toastr.success('Ergebnisse wurden exportiert');
});

ipc.on('single-value-updated', function (sender, teamIdx, gameIdx, result) {
    var row = $('#scoreBoardBody tr').eq(teamIdx);
    var cell = $('.result', row).eq(gameIdx);
    cell.val(result);

    // Recalculate sums and save them back to data storage (as sums are currently updated by the gui... bad design...)
    valueChanged();
});

// Start without loaded data
updateSums();


toastr.options.positionClass = 'toast-bottom-right';
toastr.options.timeOut = 1000;            // How long the toast will display without user interaction
toastr.options.extendedTimeOut = 5000;    // How long the toast will display after a user hovers over it


//$('.ui.menu').menu();
$(document).ready(function() {
    $('.ui.dropdown').dropdown();
    //$('.ui.menu').menu(); // Does not work and is not needed?
});

/*
TODO:
* Sortieren
 */
