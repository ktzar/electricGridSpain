export const energyTypes = ['solarpv' , 'wind' , 'solarthermal' , 'hidro', 'nuclear', 'thermal' , 'cogen' , 'gas' , 'carbon', 'inter', 'bat', 'consBat']

export type ListOfMeasurements = {name: EnergyType, value: number}[]

export type MeasurementSet = Record<string, number>

export type EnergyType = typeof energyTypes[number]

