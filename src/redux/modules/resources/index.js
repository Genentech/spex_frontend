import { call, put } from 'redux-saga/effects';
import backendClient from '@/middleware/backendClient';
import { createSlice, createSelector, startFetching, stopFetching } from '@/redux/utils';
import hash from '+utils/hash';


const initialState = {
  isFetching: false,
  error: '',
  resources: {},
};

let api;

const initApi = () => {
  if (!api) {
    api = backendClient();
  }
};

const baseUrl = '/resource';

const isObject = (value) => value != null && typeof value === 'object' && !Array.isArray(value);

const normalizedResource = (job) => {
  let content;
  try {
    content = JSON.parse(job.content);
  } catch(e) {
    content = {};
  }
  content = isObject(content) ? content : {};
  return { ...job, content };
};


const slice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    fetchResources: startFetching,
    createResource: startFetching,
    updateResource: startFetching,
    deleteResource: startFetching,

    fetchResourcesSuccess: (state, { payload: resources }) => {
      stopFetching(state);
      const normalizedResources = resources.map(normalizedResource);
      state.resources = hash(normalizedResources || [], 'id');
    },

    updateResourceSuccess: (state, { payload: resource }) => {
      stopFetching(state);
      state.resources[resource.id] = normalizedResource(resource);
    },

    createResourceSuccess: (state, { payload: resource }) => {
      stopFetching(state);
      state.resources[resource.id] = normalizedResource(resource);
    },

    deleteResourceSuccess(state, { payload: id }) {
      stopFetching(state);
      delete state.resources[id];
    },

    clearResources: (state) => {
      state.resources = {};
    },

    requestFail(state, { payload: { message } }) {
      stopFetching(state);
      state.error = message;
    },

    cancel: stopFetching,
  },

  sagas: (actions) => ({
    [actions.fetchResources]: {
      * saga() {
        initApi();

        try {
          const url = `${baseUrl}`;
          const { data } = yield call(api.get, url);
          yield put(actions.fetchResourcesSuccess(data.data));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.createResource]: {
      * saga({ payload: resource }) {
        initApi();

        try {
          const url = `${baseUrl}`;
          const { data } = yield call(api.post, url, resource);
          yield put(actions.createResourceSuccess(data.data));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.updateResource]: {
      * saga({ payload: resource }) {
        initApi();

        try {
          const url = `${baseUrl}/${resource.id}`;
          const { data } = yield call(api.put, url, resource);
          yield put(actions.updateResourceSuccess(data.data));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.deleteJob]: {
      * saga({ payload: id }) {
        initApi();

        try {
          const url = `${baseUrl}/${id}`;
          yield call(api.delete, url);
          yield put(actions.deleteResourceSuccess(id));
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

    getResources: createSelector(
      [getState],
      (state) => state?.resources,
    ),

    getResource: (id) => createSelector(
      [getState],
      (state) => state?.resources[id],
    ),
  }),
});

export const { actions, selectors } = slice;
export default slice;
