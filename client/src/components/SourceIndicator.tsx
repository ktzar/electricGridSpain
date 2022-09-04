import { colours } from '../shared/colours'
import { EnergyType } from '../shared/types'

interface SourceIndicatorProps {
    type: EnergyType
}

export const SourceIndicator = (props : SourceIndicatorProps) => {
    const styles = {
        backgroundColor: colours[props.type],
        width: '20px',
        height: '20px',
        display: 'inline-block',
        verticalAlign: 'text-top',
        border: '1px solid black',
        marginRight: '10px',
        padding: '2px'
    }
    return (
        <div style={styles}></div>
    );
}
