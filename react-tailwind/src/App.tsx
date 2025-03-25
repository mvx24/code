import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';

import Homepage from '@/pages/Homepage';
import Visibility from '@/pages/Visibility';
import Mask from '@/pages/Mask';

import './App.css';

const SearchParams = lazy(() => import('@/pages/SearchParams'));

function App() {
  return (
    <Switch>
      <Route path="/" component={Homepage} />
      <Route path="/useSearchParams">
        <Suspense>
          <SearchParams />
        </Suspense>
      </Route>
      <Route path="/useVisibility" component={Visibility} />
      <Route path="/useMask" component={Mask} />
      <Route>
        <div>404 not found</div>
      </Route>
    </Switch>
  );
}

export default App;
