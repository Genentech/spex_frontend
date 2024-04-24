import React from 'react';
import { Switch, Route } from 'react-router-dom';

import PrivateRoute from '+components/PrivateRoute';
import Login from '@/components/Login';
import PrivateRoutes from './PrivateRoutes';

const AppRouter = () => {
  return (
    <Switch>
      <Route exact path="/login" component={Login} />

      <PrivateRoute component={PrivateRoutes} />
    </Switch>
  );
};

export default AppRouter;
