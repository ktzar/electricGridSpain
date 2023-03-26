import React from 'react';
import ReactDom from 'react-dom';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query'
import 'chart.js/auto';

import Today from './components/Today';
import Averages from './components/Averages';
import Production from './components/Production';
import { Emissions } from './components/Emissions';

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
            <h2>Production</h2>
            <Production/>
            <h2>Emissions</h2>
            <Emissions/>
            <hr/>
            <div className="text-center m-t-5">by <a href="https://github.com/ktzar">ktz</a></div>
            <div className="text-center m-t-5">data from <a href="https://www.ree.es/en/apidatos">Red Eléctrica de España</a></div>
            <div className="text-center m-t-5">inspired by <a href="https://grid.iamkate.com/">Kate Rose Morley</a></div>
        </div>
      </QueryClientProvider>
    </>);
}

const version = document.getElementById('root');
if (version) {
    version.innerHTML = 'version ' + __APP_VERSION__
}
const root = document.getElementById('root');
if (root) root.innerHTML = 'Loading...';
ReactDom.render(<App/>, root);
