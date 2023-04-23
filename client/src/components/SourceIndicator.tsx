import { colours } from '../shared/colours'
import { EnergyType } from '../shared/types'

interface SourceIndicatorProps {
    type: EnergyType,
    title: string
}

const energyInfo : Record<EnergyType, string> = {
    solarpv: 'Solar PV is the conversion of sunlight into electricity, either directly using photovoltaics (PV), or indirectly using concentrated solar power (CSP).',
    wind: 'Wind power is the use of air flow through wind turbines to mechanically power generators for electric power. Wind power, as an alternative to burning fossil fuels, is plentiful, renewable, widely distributed, clean, produces no greenhouse gas emissions during operation, consumes no water, and uses little land.',
    hidro: 'Hydropower or water power is power derived from the energy of falling or fast-flowing water, which may be harnessed for useful purposes. Hydropower is a renewable energy source.',
    solarthermal: 'Solar thermal energy is a form of energy and a technology for harnessing solar energy to generate thermal energy or electrical energy for use in industry, and in the residential and commercial sectors. A wide range of applications use solar thermal energy, including hot water heating, central heating, air conditioning, thermal desalination, cooking, drying, and space heating.',
    carbon: 'Coal is a combustible black or brownish-black sedimentary rock usually occurring in rock strata in layers or veins called coal beds or coal seams. The harder forms, such as anthracite coal, can be regarded as metamorphic rock because of later exposure to elevated temperature and pressure.',
    gas: 'Natural gas is a naturally occurring hydrocarbon gas mixture consisting primarily of methane, but commonly including varying amounts of other higher alkanes, and sometimes a small percentage of carbon dioxide, nitrogen, oxygen, and sulfur.',
    cogeneration: 'Cogeneration or combined heat and power (CHP) is the use of a heat engine or power station to generate electricity and useful heat at the same time. Trigeneration or combined cooling, heat and power (CCHP) refers to the simultaneous generation of electricity and useful heating and cooling from the combustion of a fuel or a solar heat source. Cogeneration and trigeneration are both means of achieving energy efficiency, and are both forms of combined heat and power (CHP).',
    nuclear: 'Nuclear power is the use of nuclear reactions that release nuclear energy to generate heat, which most frequently is then used in steam turbines to produce electricity in a nuclear power plant. Nuclear power can be obtained from nuclear fission, nuclear decay and nuclear fusion reactions.',
    thermal: 'Thermal power is the largest source of power generation in India. There are different types of thermal power plants based on the fuel used to generate the steam such as coal, gas, and diesel, natural gas. Based on the type of steam cycle used to convert water into steam, we can classify the thermal power plants as coal-based thermal power plant, gas-based thermal power plant and diesel-based thermal power plant.'
}

export const SourceIndicator = (props : SourceIndicatorProps) => {
    const styles = {
        backgroundColor: colours[props.type],
        width: '20px',
        height: '20px',
        display: 'inline-block',
        verticalAlign: 'text-top',
        border: '1px solid black',
        marginRight: '0px',
        marginLeft: '10px',
        padding: '2px'
    }

    const tooltip = energyInfo[props.type]
    return (
        <>
            <div style={styles}></div> <small>{props.title}</small> {tooltip && <span title={tooltip} style={{cursor: 'pointer'}}>ⓘ</span>}
        </>
    )
}