export interface ButtonProps {
    onClick: () => void;
    children: React.ReactNode;
}

export const Button = (props : ButtonProps) => {
    return <button
        className="btn btn-small btn-info"
        style={{margin: '0.5em', padding: '0.25em 0.5em', fontSize: '12px'}}
        onClick={props.onClick}>{props.children}</button>
}