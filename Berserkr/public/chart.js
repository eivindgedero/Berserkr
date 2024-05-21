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
            const textContainer = document.createElement("div"); // Flex container
            const option = document.createElement("span");
            const downloadLink = document.createElement("a");
            const icon = document.createElement("i");

            textContainer.style.display = 'flex';
            textContainer.style.justifyContent = 'space-between';
            textContainer.style.alignItems = 'center';

            // Configuring the span to display and handle graph rendering
            option.textContent = run;
            option.classList.add("nav-link");
            option.addEventListener('click', async () => {
                await fetchAndRenderGraph(`${run}.csv`);
                list.querySelectorAll('.nav-link').forEach(item => {
                    item.classList.remove('active');
                });
                option.classList.add('active');
            });

            // textContainer.style.display = 'flex';
            // textContainer.style.justifyContent = 'space-between';
            textContainer.style.alignItems = 'center';

            icon.className = 'material-icons';
            icon.textContent = 'file_download';
            icon.style.color = '#f1e6e4';
            downloadLink.appendChild(icon);
            downloadLink.href = `/download/${run}.csv`;
            downloadLink.classList.add("download-link", "download-hover");

            textContainer.appendChild(option);
            textContainer.appendChild(downloadLink);

            listItem.appendChild(textContainer);
            list.appendChild(listItem);
        });
    } catch (error) {
        console.error("Failed to load runs:", error);
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
        let jsonData = await response.json();

        jsonData = jsonData.filter(item => {
            return !['N2O_injector_pressure_time', 'ethanol_injector_pressure_time', 'N2O_injector_temperature_time', 'ethanol_injector_temperature_time', 'N2O_tank_temperature_top_time', 'N2O_tank_temperature_bot_time', 'N2O_tank_pressure_time', 'engine_chamber_pressure_time', 'thrust2_time']
                .some(key => item[key] === '00:00:00.00');
        });

        updateGraphs(jsonData);
    } catch (error) {
        console.error(`Failed to fetch data for run: ${run}`, error);
    }
}

function updateGraphs(jsonData) {
    renderGraph('injector_pressure', jsonData, {
        N2O_injector_pressure: {
            timeKey: 'N2O_injector_pressure_time',
            label: 'N₂O Injector Pressure',
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
            label: 'N₂O Injector Temperature',
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
            label: 'N₂O Tank Temperature Top',
            borderColor: 'rgb(75, 192, 192)',
        },
        N2O_tank_temperature_bot: {
            timeKey: 'N2O_tank_temperature_bot_time',
            label: 'N₂O Tank Temperature Bottom',
            borderColor: 'rgb(255, 99, 132)',
        },
        ethanol_tank_temperature: {
            timeKey: 'ethanol_tank_temperature_time',
            label: 'Ethanol Tank Temperature',
            borderColor: '#9966ff',
        }
    }, 'Temperature [°C]');

    renderGraph('tank_pressure', jsonData, {
        N2O_tank_pressure: {
            timeKey: 'N2O_tank_pressure_time',
            label: 'N₂O Tank Pressure',
            borderColor: 'rgb(75, 192, 192)',
        },
        ethanol_tank_pressure: {
            timeKey: 'ethanol_tank_pressure_time',
            label: 'Ethanol Tank Pressure',
            borderColor: 'rgb(255, 99, 132)',
        },
        nitrogen_tank_pressure: {
            timeKey: 'nitrogen_tank_pressure_time',
            label: 'Nitrogen Tank Pressure',
            borderColor: '#9966ff',
        }
    }, 'Pressure [bar]');

    renderGraph('engine_pressure', jsonData, {
        engine_chamber_pressure: {
            timeKey: 'engine_chamber_pressure_time',
            label: 'Engine Chamber Pressure',
            borderColor: 'rgb(75, 192, 192)',
        }
    }, 'Pressure [bar]');

    renderGraph('tank_mass', jsonData, {
        N2O_tank_mass: {
            timeKey: 'N2O_tank_mass_time',
            label: 'N₂O Tank Mass',
            borderColor: 'rgb(75, 192, 192)',
        },
        ethanol_tank_mass: {
            timeKey: 'ethanol_tank_mass_time',
            label: 'Ethanol Tank Mass',
            borderColor: 'rgb(255, 99, 132)',
        }
    }, 'Mass [kg]');

    // Determine the minimum timestamp from the thrust2_time key to use as the zero time
    let minThrustTimestamp = null;
    jsonData.forEach(item => {
        if (item['thrust2_time']) {
            const currentTimestamp = new Date('1970-01-01T' + item['thrust2_time'] + 'Z');
            if (minThrustTimestamp === null || currentTimestamp < minThrustTimestamp) {
                minThrustTimestamp = currentTimestamp;
            }
        }
    });


    const totalThrustData = jsonData.map(item => {
        const itemDate = item['thrust2_time'] ? new Date('1970-01-01T' + item['thrust2_time'] + 'Z') : null;
        return {
            x: itemDate ? (itemDate - minThrustTimestamp) / 1000 : null,  // Convert the time to seconds relative to the min timestamp
            y: (parseFloat(item.thrust1) || 0) +
                (parseFloat(item.thrust2) || 0) +
                (parseFloat(item.thrust3) || 0) +
                (parseFloat(item.thrust4) || 0)
        };
    }).filter(item => item.x !== null);  // Filter out entries without a valid time

    renderGraphForTotalThrust('total_thrust', totalThrustData, 'Force [N]');

}

function renderGraph(canvasId, jsonData, sensors, yAxisLabel) {
    let minTimestamp = null;
    Object.values(sensors).forEach(sensor => {
        jsonData.forEach(item => {
            if (item[sensor.timeKey] && (minTimestamp === null || new Date('1970-01-01T' + item[sensor.timeKey] + 'Z') < minTimestamp)) {
                minTimestamp = new Date('1970-01-01T' + item[sensor.timeKey] + 'Z');
            }
        });
    });

    const datasets = Object.keys(sensors).map(sensorKey => {
        const sensorInfo = sensors[sensorKey];
        const data = jsonData.map(item => {
            const itemDate = item[sensorInfo.timeKey] ? new Date('1970-01-01T' + item[sensorInfo.timeKey] + 'Z') : null;
            return {
                x: itemDate ? (itemDate - minTimestamp) / 1000 : null, // Convert time difference to seconds
                y: item[sensorKey]
            };
        }).filter(item => item.x !== null); // Filter out any data points without a valid timestamp

        return {
            label: sensorInfo.label,
            data: data,
            borderColor: sensorInfo.borderColor,
            borderWidth: 2,
            fill: false,
            pointRadius: 0
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
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Time [s]'
                    },
                },
                y: {
                    beginAtZero: true,
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
                borderWidth: 2,
                fill: false,
                pointRadius: 0,
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Time [s]'
                    },
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: yAxisLabel
                    },
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

