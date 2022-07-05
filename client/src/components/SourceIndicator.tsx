import { colours } from '../shared/colours'

export const SourceIndicator = ({type}) => {
    const styles = {
        backgroundColor: colours[type],
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
