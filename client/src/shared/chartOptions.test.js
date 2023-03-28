const { chartOptions } = require('./chartOptions');

describe('chartOptions', () => {
    it('should return a chartOptions object with default values', () => {
        const options = chartOptions();
        expect(options.plugins.title.text).toStrictEqual(
            'Average Production in period (GW)'
        );
    });

    it('should return a chartOptions object with custom title', () => {
        const options = chartOptions({title: 'My custom title'});
        expect(options.plugins.title.text).toStrictEqual('My custom title');
    });

});