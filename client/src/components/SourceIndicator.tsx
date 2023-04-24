import { colours } from '../shared/colours'
import { EnergyType } from '../shared/types'
import InfoIconTooltip from './InfoIconTooltip';

interface SourceIndicatorProps {
    type: EnergyType,
    title: string
}

const energyInfo : Record<EnergyType, {title: string, desc: string}> = {
    solarpv: {
        title: 'Solar photovoltaics',
        desc: 'Solar Photovoltaics: Solar photovoltaics (PV) convert sunlight directly into electricity through semiconducting materials. This clean and sustainable energy source is increasingly utilized for residential, commercial, and utility-scale applications.'
    },
    wind: {
        title: 'Wind Energy',
        desc: 'Wind energy harnesses the power of moving air by utilizing wind turbines that convert kinetic energy into mechanical energy, which is then transformed into electricity. It\'s an abundant and eco-friendly energy source that contributes significantly to reducing greenhouse gas emissions.'
    },
    hidro: {
        title: 'Hydroelectric Power',
        desc: 'Hydroelectric power generates electricity by harnessing the energy of flowing water, typically through the construction of dams and turbines. This renewable and reliable energy source is one of the oldest and most widely used forms of green energy production.'
    },
    solarthermal: {
        title: 'Solar Concentration Systems',
        desc: 'Solar concentration systems use mirrors or lenses to focus sunlight onto a small area, generating intense heat that drives turbines or engines to produce electricity. This renewable technology offers large-scale power generation with minimal environmental impact.'
    },
    carbon: {
        title: 'Coal Power',
        desc: 'Coal is a fossil fuel formed from ancient plant material, which, when burned, releases energy in the form of heat. Its widespread use for electricity generation, however, contributes to significant air pollution and greenhouse gas emissions.'
    },
    gas: {
        title: 'Natural Gas',
        desc: 'Natural gas, primarily composed of methane, is extracted from underground reservoirs and used as a fuel for electricity generation, heating, and transportation. While it burns cleaner than coal, it remains a finite resource that contributes to greenhouse gas emissions.'
    },
    cogen: {
        title: 'Cogeneration',
        desc: 'Cogeneration, or combined heat and power (CHP), is an energy-efficient process that simultaneously generates electricity and useful thermal energy from a single fuel source, such as natural gas, biomass, or coal. This method reduces energy waste and lowers overall emissions.'
    },
    nuclear: {
        title: 'Nuclear Power',
        desc: 'Nuclear power plants generate electricity by using the heat produced from nuclear fission, wherein atomic nuclei are split, releasing a large amount of energy. This energy source provides reliable, low-emission electricity but raises concerns about radioactive waste management and safety.'
    },
    thermal: {
        title: 'Geothermal Energy',
        desc: 'Thermal energy is derived from heat stored within the Earth\'s crust and can be harnessed through geothermal power plants. This sustainable and low-emission energy source taps into the planet\'s natural heat for electricity generation and heating applications.'
    }
      };


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

    const tooltip = energyInfo[props.type] && energyInfo[props.type].desc || false
    const title = energyInfo[props.type] && energyInfo[props.type].title || props.title
    return (
        <>
            <div style={styles}></div> <small>{title}</small> {tooltip && <InfoIconTooltip text={tooltip} />}
        </>
    )
}