export const chartOptions = ({
    title = 'Average Production in period (GW)',
    unit = 'GWh',
    min = 0,
    max = 5000,
    displayXAxis = false
} = {}) => ({
    responsive: true,
    plugins: {
        title: {
            display: true,
            text: title
        },
        legend: {
            display: false
        },
    },
    animation: { duration: 0 },
    elements: {
        point:{
            radius: 0
        }
    },
    interaction: {
        intersect: false,
    },
    scales: {
        x: {
            display: displayXAxis,
            title: {
                display: true
            }
        },
        y: {
            suggestedMin: min,
            suggestedMax: max,
            display: true,
            title: {
                display: true,
                text: unit
            },
        }
    }
});
