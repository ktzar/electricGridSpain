import { EnergyType } from './types'

export const acceptedColours = ['orange', 'blue' ,'red' ,'purple' ,'pink' ,'lightblue' ,'grey' ,'yellow' ,'teal' ,'brown']
export type Colour = typeof acceptedColours[number]

export const colours : Record<EnergyType, Colour> = {
    solarpv: 'orange',
    wind: 'blue',
    solarthermal: 'red',
    hidro: 'lightblue',
    nuclear: 'purple',
    inter: 'pink',
    thermal: 'grey',
    cogen: 'yellow',
    gas: 'teal',
    carbon: 'brown'
}

type GroupConfig = {
    label: string
    labels: string[]
    colour: string
}

export const energyGroups : Record<string, GroupConfig> = {
    renewables: {
        label: 'Renewables',
        labels: ['solarpv', 'wind', 'hidro', 'solarthermal'],
        colour: '#afa',
    },
    clean: {
        label: 'Clean',
        labels: ['nuclear', 'thermal'],
        colour: '#aaf',
    },
    fossil: {
        label: 'Fossil',
        labels: ['carbon', 'gas', 'cogen'],
        colour: '#faa',
    },
    other: {
        label: 'Other',
        labels: [],
        colour: 'grey'
    }
}

