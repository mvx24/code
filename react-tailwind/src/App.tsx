import { Route, Switch } from 'wouter';

import Homepage from '@/pages/Homepage';
import SearchParams from '@/pages/SearchParams';
import Visibility from '@/pages/Visibility';
import Mask from '@/pages/Mask';

import './App.css';

function App() {
  return (
    <Switch>
      <Route path="/" component={Homepage} />
      <Route path="/useSearchParams" component={SearchParams} />
      <Route path="/useVisibility" component={Visibility} />
      <Route path="/useMask" component={Mask} />
      <Route>
        <div>404 not found</div>
      </Route>
    </Switch>
  );
}

export default App;
