export const energyTypes = ['solarpv' , 'wind' , 'solarthermal' , 'hidro', 'nuclear', 'thermal' , 'cogen' , 'gas' , 'carbon', 'cogen', 'inter']

export type ListOfMeasurements = {name: EnergyType, value: number}[]

export type MeasurementSet = Record<string, number>

export type EnergyType = typeof energyTypes[number]

