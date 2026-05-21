import { Component, ReactNode } from 'react';

interface Props {
    label: string;
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false }

    static getDerivedStateFromError(): State {
        return { hasError: true }
    }

    componentDidCatch(error: Error) {
        console.error(`${this.props.label} component crashed:`, error)
    }

    render() {
        if (this.state.hasError) {
            return <div className="card mt-2">
                <div className="card-body">
                    <h5>{this.props.label}</h5>
                    <p className="text-muted mb-0">Could not load this section.</p>
                </div>
            </div>
        }
        return this.props.children
    }
}
