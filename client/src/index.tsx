import React from 'react';
import ReactDom from 'react-dom';
import Today from './components/Today';
import 'chart.js/auto';
import Averages from './components/Averages';
import Production from './components/Production';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query'

const queryClient = new QueryClient()


const App = () => {
    return (<>
      <QueryClientProvider client={queryClient}>
        <div className="container">
            <h1 className="text-center">🇪🇸 Spanish grid dashboard</h1>
            <h2>Today</h2>
            <Today/>
            <hr/>
            <h2>Averages</h2>
            <Averages/>
            <hr/>
            <h2>Production</h2>
            <Production/>
            <div className="text-center m-t-5">by <a href="https://github.com/ktzar">ktz</a></div>
            <div className="text-center m-t-5">data from <a href="https://www.ree.es/en/apidatos">Red Eléctrica de España</a></div>
        </div>
      </QueryClientProvider>
    </>);
}

ReactDom.render(<App/>, document.getElementById('root'));
