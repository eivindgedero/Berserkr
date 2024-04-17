let charts = {};

async function loadRunOptions() {
    const list = document.getElementById("navbar-data");
    list.innerHTML = '';

    const headerItem = document.createElement("li");
    headerItem.textContent = "Select dataset:";
    headerItem.classList.add("nav-header");
    list.appendChild(headerItem);

    try {
        const response = await fetch("/runs");
        const runs = await response.json();
        runs.forEach(run => {
            const listItem = document.createElement("li");
            const option = document.createElement("span");
            option.textContent = run;
            option.classList.add("nav-link");
            option.addEventListener('click', async () => {
                await fetchAndRenderGraph(`${run}.csv`);
                // Remove active class from all items
                list.querySelectorAll('.nav-link').forEach(item => {
                    item.classList.remove('active');
                });
                // Add active class to clicked item
                option.classList.add('active');
            });
            listItem.appendChild(option);
            list.appendChild(listItem);
        });
    } catch (error) {
        console.error(`Failed to load runs:`, error);
    }
}

function destroyAllCharts() {
    Object.keys(charts).forEach((chartId) => {
        if (charts[chartId]) {
            charts[chartId].destroy();
            charts[chartId] = null;
        }
    });
}

async function fetchAndRenderGraph(run) {
    try {
        const response = await fetch(`/run/${run}`);
        const jsonData = await response.json();
        updateGraphs(jsonData);
    } catch (error) {
        console.error(`Failed to fetch data for run: ${run}`, error);
    }
}

function updateGraphs(jsonData) {
    renderGraph('injector_pressure', jsonData, {
        N2O_injector_pressure: {
            timeKey: 'N2O_injector_pressure_time',
            label: 'N2O Injector Pressure',
            borderColor: 'rgb(75, 192, 192)',
        },
        ethanol_injector_pressure: {
            timeKey: 'ethanol_injector_pressure_time',
            label: 'Ethanol Injector Pressure',
            borderColor: 'rgb(255, 99, 132)',
        }
    }, 'Pressure [bar]');

    renderGraph('injector_temperature', jsonData, {
        N2O_injector_temperature: {
            timeKey: 'N2O_injector_temperature_time',
            label: 'N2O Injector Temperature',
            borderColor: 'rgb(75, 192, 192)',
        },
        ethanol_injector_temperature: {
            timeKey: 'ethanol_injector_temperature_time',
            label: 'Ethanol Injector Temperature',
            borderColor: 'rgb(255, 99, 132)',
        }
    }, 'Temperature [°C]');

    renderGraph('tank_temperature', jsonData, {
        N2O_tank_temperature_top: {
            timeKey: 'N2O_tank_temperature_top_time',
            label: 'N2O Tank Temperature Top',
            borderColor: 'rgb(75, 192, 192)',
        },
        N2O_tank_temperature_bot: {
            timeKey: 'N2O_tank_temperature_bot_time',
            label: 'N2O Tank Temperature Bottom',
            borderColor: 'rgb(255, 99, 132)',
        }
    }, 'Temperature [°C]');

    renderGraph('tank_pressure', jsonData, {
        N2O_tank_pressure: {
            timeKey: 'N2O_tank_pressure_time',
            label: 'N2O Tank Pressure',
            borderColor: 'rgb(75, 192, 192)',
        }
    }, 'Pressure [bar]');

    renderGraph('engine_pressure', jsonData, {
        engine_chamber_pressure: {
            timeKey: 'engine_chamber_pressure_time',
            label: 'Engine Chamber Pressure',
            borderColor: 'rgb(75, 192, 192)',
        }
    }, 'Pressure [bar]');

    const totalThrustData = jsonData.map(item => {
        return {
            x: item['thrust2_time'] ? new Date('1970-01-01T' + item['thrust2_time'] + 'Z') : null,
            y: (parseFloat(item.thrust1) || 0) +
                (parseFloat(item.thrust2) || 0) +
                (parseFloat(item.thrust3) || 0) +
                (parseFloat(item.thrust4) || 0) +
                (parseFloat(item.thrust5) || 0) +
                (parseFloat(item.thrust6) || 0)
        };
    }).filter(item => item.x !== null);

    renderGraphForTotalThrust('total_thrust', totalThrustData, 'Force [N]');
}

function renderGraph(canvasId, jsonData, sensors, yAxisLabel) {
    const datasets = Object.keys(sensors).map(sensorKey => {
        const sensorInfo = sensors[sensorKey];
        const data = jsonData.map(item => ({
            x: item[sensorInfo.timeKey] ? new Date('1970-01-01T' + item[sensorInfo.timeKey] + 'Z') : null,
            y: item[sensorKey]
        })).filter(item => item.x !== null);  // Filter out any data points without a valid timestamp

        return {
            label: sensorInfo.label,
            data: data,
            borderColor: sensorInfo.borderColor,
            fill: false
        };
    });

    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }

    const ctx = document.getElementById(canvasId).getContext('2d');
    charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: { datasets: datasets },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        parser: 'HH:mm:ss.SSS',
                        unit: 'second',
                        displayFormats: {
                            second: 'HH:mm:ss',
                            tooltip: 'HH:mm:ss.SSS'
                        },
                        tooltipFormat: 'HH:mm:ss.SSS'
                    },
                    title: {
                        display: true,
                        text: 'Time [s]'
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: yAxisLabel
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
            },
            maintainAspectRatio: false,
            responsive: true,
        }
    });
}
function renderGraphForTotalThrust(canvasId, dataset, yAxisLabel) {
    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }

    const ctx = document.getElementById(canvasId).getContext('2d');
    charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Total Engine Thrust',
                data: dataset,
                borderColor: 'rgb(75, 192, 192)',
                fill: false
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        parser: 'HH:mm:ss.SSS',
                        unit: 'second',
                        displayFormats: {
                            second: 'HH:mm:ss',
                            tooltipFormat: 'HH:mm:ss.SSS'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Time [s]'
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: yAxisLabel
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
            },
            maintainAspectRatio: false,
            responsive: true,
        }
    });
}


loadRunOptions();

