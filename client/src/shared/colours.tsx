export type EnergyTypes = 'solarpv' | 'wind' | 'solarthermal' | 'nuclear' | 'inter' | 'hidro' | 'thermal' | 'cogen' | 'gas' | 'carbon'

export type Colours = 'orange' | 'blue' | 'red' | 'purple' | 'pink' | 'lightblue' | 'grey' | 'yellow' | 'teal' | 'brown'

export const colours : Record<EnergyTypes, Colours> = {
    solarpv: 'orange',
    wind: 'blue',
    solarthermal: 'red',
    nuclear: 'purple',
    inter: 'pink',
    hidro: 'lightblue',
    thermal: 'grey',
    cogen: 'yellow',
    gas: 'teal',
    carbon: 'brown'
}

