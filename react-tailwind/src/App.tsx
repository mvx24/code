import { Route, Switch, useLocation } from 'wouter';

import Homepage from './pages/Homepage';
import SearchParams from './pages/SearchParams';

import './App.css';

function App() {
  return (
    <Switch>
      <Route path="/" component={Homepage} />
      <Route path="/useSearchParams" component={SearchParams} />
      <Route>
        <div>404 not found</div>
      </Route>
    </Switch>
  );
}

export default App;
