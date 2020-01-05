var updateData = function () {
    $.get({
        url: window.serverUrl + '/api/getData',
        timeout: 5000,
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
                        fontSize: 20,
                        fontColor: '#000',
                        callback: function (label, idx, allLabels, c) {
                            // TODO Insert line breaks / shorten ?
                            if (label.length > 30) {
                                return label.substr(0, 14) + '...' + label.substr(-14);
                            } else {
                                return label;
                            }
                        },
                    },
                }],
            },
            "animation": {
                "duration": 1,
                "onComplete": function () {
                    var chartInstance = this.chart,
                        ctx = chartInstance.ctx;

                    ctx.font = Chart.helpers.fontString(chartInstance.options.scales.yAxes[0].ticks.fontSize * 1.3, 'bold', Chart.defaults.global.defaultFontFamily);
                    ctx.textBaseline = 'middle';

                    this.data.datasets.forEach(function (dataset, i) {
                        var meta = chartInstance.controller.getDatasetMeta(i);
                        meta.data.forEach(function (bar, index) {
                            var data = dataset.data[index];
                            var barWidth = bar._model.x - bar._model.base;

                            if (barWidth < 50) {
                                ctx.fillStyle = '#000';
                                ctx.textAlign = 'left';
                                ctx.fillText(data, bar._model.x + 10, bar._model.y);
                            } else {
                                ctx.fillStyle = '#FFF';
                                ctx.textAlign = 'right';
                                ctx.fillText(data, bar._model.x - 10, bar._model.y);
                            }
                        });
                    });
                },
            }
        }
    });
});

updateData();
