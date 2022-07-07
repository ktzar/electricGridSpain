export const energyTypes = ['solarpv' , 'wind' , 'solarthermal' , 'nuclear' , 'inter' , 'hidro' , 'thermal' , 'cogen' , 'gas' , 'carbon']
export type EnergyType = typeof energyTypes[number]

export const acceptedColours = ['orange', 'blue' ,'red' ,'purple' ,'pink' ,'lightblue' ,'grey' ,'yellow' ,'teal' ,'brown']
export type Colour = typeof acceptedColours[number]

export const colours : Record<EnergyType, Colour> = {
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

