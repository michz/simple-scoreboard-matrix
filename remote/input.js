// @TODO Extract shared code?

var countColumns = function () {
    return $('#scoreBoardHead tr:first th').length - 2;
};

var addRow = function (skipValueChangedHandler) {
    var rowContent = '';
    var columnCount = countColumns();
    for (var i = 0; i < columnCount; i++) {
        rowContent += '<td class="result"></td>';
    }

    var row = '<tr>' +
        '<td class="row-header"></td>' +
        rowContent +
        '<td class="sum"></td>' +
        '</tr>';

    $('#scoreBoardBody').append(row);

    if (undefined === skipValueChangedHandler || true !== skipValueChangedHandler) {
        valueChanged();
    }
};

var addColumn = function (skipValueChangedHandler) {
    var column = '<td class="result"></td>';
    $('#scoreBoardHead tr th:last').before('<th class="result-header"><span class="column-number">' + (countColumns() + 1) + '</span></th>');

    $('#scoreBoardBody tr').each(function (idx, element) {
        $(element).find('td:last').before(column);
    });

    if (undefined === skipValueChangedHandler || true !== skipValueChangedHandler) {
        valueChanged();
    }
};

var updateSums = function () {
    $('#scoreBoardBody tr').each(function (idx, element) {
        var sum = 0;
        $(element).find('.result').each(function (idx, resultElement) {
            var value = parseFloat($(resultElement).text());
            if (false === isNaN(value))  {
                sum += value;
            }
        });
        $(element).find('.sum').text(sum);
    });
};

var updateData = function () {
    $.get({
        url: window.serverUrl + '/api/getData',
        success: function (data) {
            var results = data.results;
            var countRows = results.length;

            // clear current rows and columns
            $('#scoreBoardBody').html('');
            $('#scoreBoardHead .result-header').remove();

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

                row.find('.row-header').html(rowData.team);
                for (var j = 0; j <= columnCount; j++) {
                    row.find('.result').eq(j-1).text(rowData['' + j]);
                }
            }

            updateSums();
        },
        error: function () {
            // @TODO Display connection problems error
        },
        complete: function () {
            window.setTimeout(updateData, 15000);
        },
    });
};

$(document).ready(function() {
    updateData();

    $(document).on('click', '.result', function () {
        var inputModal = $('#input-modal');

        var row = $(this).closest('tr');
        var cell = $(this).closest('td');
        var rowIndex = $('#scoreBoardBody tr').index(row);
        var cellIndex = $('.result', row).index(cell);

        inputModal.find('input[name=teamIdx]').val(rowIndex);
        inputModal.find('input[name=gameIdx]').val(cellIndex);
        inputModal.find('input[name=result]').val($(this).text());

        inputModal.modal({
            closable: false,
            onDeny: function () {
                $(this).find('input[name=result]').val('');
            },
            onApprove: function () {
                $.get({
                    url: window.serverUrl + '/api/setDataItem',
                    method: 'post',
                    dataType: 'json',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        teamIdx: parseInt($(this).find('input[name=teamIdx]').val()),
                        gameIdx: parseInt($(this).find('input[name=gameIdx]').val()),
                        result: parseFloat($(this).find('input[name=result]').val()),
                    }),
                    success: function (data) {
                        // @TODO Update input field and visualize success
                        updateData();
                    },
                    error: function (data) {
                        // @TODO Visualize error
                    },
                    complete: function () {
                        window.setTimeout(updateData, 15000);
                    },
                });
            },
        });

        inputModal.modal('show');
    });
});
