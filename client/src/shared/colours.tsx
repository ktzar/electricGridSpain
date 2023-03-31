import { EnergyType } from './types'

export const acceptedColours = ['orange', 'blue' ,'red' ,'purple' ,'pink' ,'lightblue' ,'grey' ,'yellow' ,'teal' ,'brown']
export type Colour = typeof acceptedColours[number]

export type InstalledTypes = 'installedSolar' | 'installedWind'
export type Countries = 'Morocco' | 'France' | 'Portugal'

export const colours : Record<EnergyType | InstalledTypes | Countries , Colour> = {
    installedSolar: 'orange',
    installedWind: 'blue',
    solarpv: 'orange',
    wind: 'blue',
    solarthermal: 'red',
    hidro: 'lightblue',
    nuclear: 'purple',
    inter: 'pink',
    thermal: 'grey',
    cogen: 'yellow',
    gas: 'teal',
    carbon: 'brown',
    Morocco: 'red',
    France: 'blue',
    Portugal: 'green'
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

