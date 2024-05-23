import { call, put } from 'redux-saga/effects';
import backendClient from '@/middleware/backendClient';
import { createSelector, createSlice, startFetching, stopFetching } from '@/redux/utils';
import storage from '+utils/storage';

const initialState = {
  isFetching: false,
  isAuthenticated: !!storage.access_token,
  error: '',
};

let api;

const initApi = () => {
  if (!api) {
    api = backendClient();
  }
};

const baseUrl = '/users';

const slice = createSlice({
  name: 'auth',
  initialState,

  reducers: {
    login(state) {
      startFetching(state);
      storage.clearCredits();
      state.isAuthenticated = false;
    },

    logout(state) {
      storage.clearCredits();
      state.isAuthenticated = false;
    },

    loginSuccess(state, { payload: { authorization } }) {
      stopFetching(state);
      if (authorization) {
        storage.setItem('access_token', authorization);
        state.isAuthenticated = true;
        return;
      }
      state.error = 'Username or password is not matched';
    },

    requestFail(state) {
      stopFetching(state);
      state.error = 'Username or password is not matched';
    },

    cancel: stopFetching,
  },

  sagas: (actions) => ({
    [actions.login]: {
      * saga({ payload }) {
        initApi();

        try {
          const url = `${baseUrl}/login`;
          const { headers } = yield call(api.post, url, payload);

          yield put(actions.loginSuccess(headers));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },
  }),

  selectors: (getState) => ({
    isFetching: createSelector(
      [getState],
      (state) => state?.isFetching,
    ),

    isAuthenticated: createSelector(
      [getState],
      (state) => state?.isAuthenticated,
    ),
  }),
});

export const { actions, selectors } = slice;

export default slice;
