import React from 'react';
import ReactDom from 'react-dom';
import Today from './components/Today';
import Averages from './components/Averages';
import Production from './components/Production';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query'

const queryClient = new QueryClient()


const App = () => {
    return (<>
      <QueryClientProvider client={queryClient}>
        <div className="container">
            <h1>Spanish grid dashboard</h1>
            <h2>Today</h2>
            <Today/>
            <Averages/>
            <Production/>
        </div>
      </QueryClientProvider>
    </>);
}

ReactDom.render(<App/>, document.getElementById('root'));
