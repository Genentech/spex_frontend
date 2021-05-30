import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Switch, Route } from 'react-router-dom';

import AnalysisPage from '@/components/AnalysisPage';
import Layout from '@/components/Layout';
import NotFound404 from '@/components/NotFound404';
import Project from '@/components/Project';
import Projects from '@/components/Projects';

import { actions as authActions } from '@/redux/modules/users/auth';

const PrivateRoutes = () => {
  const dispatch = useDispatch();

  useEffect(
    () => {
      // If another window logs out, log out of this window
      window.addEventListener('storage', (e) => {
        if (e.key === 'access_token' && !e.newValue) {
          dispatch(authActions.logout('You have been automatically signed out from another window.'));
        }
      });
    },
    [dispatch],
  );

  return (
    <Layout>
      <Switch>
        <Route
          exact
          path={[ '/', '/project' ]}
          component={Projects}
        />
        <Route
          exact
          path={[ '/project/:id' ]}
          component={Project}
        />
        <Route
          exact
          path={[
            '/project/:id/dataset', '/project/:id/dataset/:id',
            '/project/:id/dataset/:id/img', '/project/:id/dataset/:id/img/:id',
          ]}
          component={AnalysisPage}
        />
        <Route hidden component={NotFound404} />
      </Switch>
    </Layout>
  );
};

export default PrivateRoutes;
