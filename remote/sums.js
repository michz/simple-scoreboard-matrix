var updateData = function () {
    $.get({
        url: window.serverUrl + '/api/getData',
        success: function (data) {
            $('#results').empty();

            var rowCount = data.results.length;
            var currrentDatasetsCounts = window.chartData.labels.length;
            if (rowCount < currrentDatasetsCounts) {
                window.chartData.labels = [];
                window.chartData.datasets[0].data = [];
            }

            for (var i = 0; i < rowCount; i++) {
                var resultRow = data.results[i];
                window.chartData.labels[i] = resultRow.team;
                window.chartData.datasets[0].data[i] = resultRow.sum;
            }

            if (window.chartInstance !== undefined) {
                window.chartInstance.update();
            }
        },
        complete: function () {
            window.setTimeout(updateData, 2000);
        },
    });
};

window.chartData = {
    labels: ['Warte...'],
    datasets: [{
        label: 'Punkte',
        backgroundColor: 'rgb(0, 0, 150)',
        borderWidth: 0,
        data: [
            0,
        ]
    }],
};

$(document).ready(function() {
    var ctx = $('#resultsCanvas').get(0).getContext('2d');
    window.chartInstance = new Chart(ctx, {
        type: 'horizontalBar',
        data: window.chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,

            // Elements options apply to all of the options unless overridden in a dataset
            // In this case, we are setting the border of each horizontal bar to be 2px wide
            elements: {
                rectangle: {
                    borderWidth: 2,
                }
            },
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
            scales: {
                xAxes: [{
                    ticks: {
                        beginAtZero: true,
                    },
                }],
                yAxes: [{
                    display: true,
                    ticks: {
                        fontSize: 24,
                        callback: function (label, idx, allLabels, c) {
                            // TODO Insert line breaks / shorten ?
                            label = label.split(' ');
                            return label;
                        },
                    },
                }],
            },
        }
    });
});

updateData();
