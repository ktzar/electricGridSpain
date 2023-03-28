export const chartOptions = ({
    title = 'Average Production in period (GW)',
    unit = 'GWh',
    min,
    max
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
            display: false,
            title: {
                display: true
            }
        },
        y: {
            min, max,
            display: true,
            title: {
                display: true,
                text: unit
            },
        }
    }
});