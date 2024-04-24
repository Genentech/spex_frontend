// make sure react-hot-loader is required before react and react-dom
// eslint-disable-next-line import/order
import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import { StylesProvider, ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles';
import { hot } from 'react-hot-loader/root';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import { configureBackendClient } from '@/middleware/backendClient';
import { store } from '@/redux';
import { actions as authActions } from '@/redux/modules/users/auth';
import AppRouter from '@/routes';
import { getTheme } from '@/themes';

configureBackendClient(() => {
  store.dispatch(authActions.logout());
});

const App = () => {
    const { theme, GlobalStyle } = getTheme('light');

    return (
      <Provider store={store}>
        <BrowserRouter>
          <StylesProvider injectFirst>
            <MuiThemeProvider theme={theme}>
              <ThemeProvider theme={theme}>
                <GlobalStyle />

                <CssBaseline />

                <AppRouter />
              </ThemeProvider>
            </MuiThemeProvider>
          </StylesProvider>
        </BrowserRouter>
      </Provider>
    );
};

export default hot(App);
