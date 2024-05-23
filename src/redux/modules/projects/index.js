import { push } from 'connected-react-router';
import { call, put } from 'redux-saga/effects';
import backendClient from '@/middleware/backendClient';
import { actions as authActions } from '@/redux/modules/users/auth';
import { createSlice, createSelector, startFetching, stopFetching } from '@/redux/utils';
import hash from '+utils/hash';


const initialState = {
  isFetching: false,
  error: '',
  projects: {},
};

let api;

const initApi = () => {
  if (!api) {
    api = backendClient();
  }
};

const baseUrl = '/projects';

const slice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    fetchProjects: startFetching,
    createProject: startFetching,
    updateProject: startFetching,
    deleteProject: startFetching,
    fetchProjectById: startFetching,

    fetchProjectsSuccess: (state, { payload: projects }) => {
      stopFetching(state);
      state.projects = hash(projects || [], 'id');
    },

    fetchProjectByIdSuccess: (state, { payload: project }) => {
      stopFetching(state);
      state.projects[project.id] = project;
    },

    updateProjectSuccess: (state, { payload: project }) => {
      stopFetching(state);
      state.projects[project.id] = project;
    },

    createProjectSuccess: (state, { payload: project }) => {
      stopFetching(state);
      state.projects[project.id] = project;
    },

    deleteProjectSuccess(state, { payload: id }) {
      stopFetching(state);
      delete state.projects[id];
    },

    clearProjects: (state) => {
      state.projects = {};
    },

    requestFail(state, { payload: { message } }) {
      stopFetching(state);
      state.error = message;
    },

    cancel: stopFetching,
  },

  sagas: (actions) => ({
    [actions.fetchProjects]: {
      * saga() {
        initApi();

        try {
          const url = `${baseUrl}`;
          const { data } = yield call(api.get, url);
          yield put(actions.fetchProjectsSuccess(data.data));
        } catch (error) {
          if (
            error.message === 'Signature has expired'
          ) {
            // eslint-disable-next-line no-console
            console.error(error.message);
            yield put(authActions.logout());
            yield put(push('/login'));
          } else {
            yield put(actions.requestFail(error));
            // eslint-disable-next-line no-console
            console.error(error.message);
          }
        }
      },
    },

    [actions.fetchProjectById]: {
      *saga({ payload: id }) {
        initApi();

        try {
          const url = `${baseUrl}/${id}`;
          const { data } = yield call(api.get, url);
          yield put(actions.fetchProjectByIdSuccess(data.data));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.createProject]: {
      * saga({ payload: project }) {
        initApi();

        try {
          const url = `${baseUrl}`;
          const { data } = yield call(api.post, url, project);
          yield put(actions.createProjectSuccess(data.data));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.updateProject]: {
      * saga({ payload: project }) {
        initApi();

        try {
          const url = `${baseUrl}/${project.id}`;
          const { data } = yield call(api.put, url, project);
          yield put(actions.updateProjectSuccess(data.data));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.deleteProject]: {
      * saga({ payload: id }) {
        initApi();

        try {
          const url = `${baseUrl}/${id}`;
          yield call(api.delete, url);
          yield put(actions.deleteProjectSuccess(id));
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

    getProjects: createSelector(
      [getState],
      (state) => state?.projects,
    ),

    getProject: (id) => createSelector(
      [getState],
      (state) => state?.projects[id],
    ),
  }),
});

export const { actions, selectors } = slice;
export default slice;
