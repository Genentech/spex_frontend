import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Switch, Route } from 'react-router-dom';
import Files from '@/components/Files';
import Layout from '@/components/Layout';
import NotFound404 from '@/components/NotFound404';
import Project from '@/components/Project';
import ProjectFiles from '@/components/ProjectFiles';

import PathNames from '@/models/PathNames';
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
          path={[ '/' ]}
          component={ProjectFiles}
        />
        <Route
          exact
          path={[ `/${PathNames.projects}` ]}
          component={ProjectFiles}
        />
        <Route exact path={`/${PathNames.files}`} component={Files} />
        <Route
          exact
          path={[
            `/${PathNames.projects}/:id`,
            `/${PathNames.projects}/:id/${PathNames.resources}`,
            `/${PathNames.projects}/:id/${PathNames.pipelines}`,
            `/${PathNames.projects}/:id/${PathNames.pipelines}/:id`,
            `/${PathNames.projects}/:id/${PathNames.processes}`,
            `/${PathNames.projects}/:id/${PathNames.processes}/:id`,
            `/${PathNames.projects}/:id/${PathNames.results}`,
          ]}
          component={Project}
        />
        <Route hidden component={NotFound404} />
      </Switch>
    </Layout>
  );
};

export default PrivateRoutes;
