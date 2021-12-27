import { all, call, put } from 'redux-saga/effects';
import backendClient from '@/middleware/backendClient';
import { createSlice, createSelector, startFetching, stopFetching } from '@/redux/utils';

import hash from '+utils/hash';

const initialState = {
  isFetching: false,
  error: '',
  jobs: {},
  jobTypes: {},
  jobsFeatureExtraction: {},
};

let api;

const initApi = () => {
  if (!api) {
    api = backendClient();
  }
};

const baseUrl = '/jobs';

const isObject = (value) => value != null && typeof value === 'object' && !Array.isArray(value);

const normalizeJob = (job) => {
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
  name: 'jobs',
  initialState,
  reducers: {
    fetchJobTypes: startFetching,
    fetchJobTypesSuccess: (state, { payload: jobTypes }) => {
      stopFetching(state);
      state.jobTypes = jobTypes;
    },

    fetchJobFeatureExtraction: startFetching,
    fetchJobFeatureExtractionSuccess: (state, { payload: jobs }) => {
      stopFetching(state);
      const normalizedJobs = jobs.map(normalizeJob);
      state.jobsFeatureExtraction = hash(normalizedJobs || [], 'id');
    },

    fetchJobs: startFetching,
    fetchJobsSuccess: (state, { payload: jobs }) => {
      stopFetching(state);
      const normalizedJobs = jobs.map(normalizeJob);
      state.jobs = hash(normalizedJobs || [], 'id');
    },

    createJob: startFetching,
    createJobSuccess: (state, { payload: job }) => {
      stopFetching(state);
      state.jobs[job.id] = normalizeJob(job);
    },

    updateJob: startFetching,
    updateJobSuccess: (state, { payload: job }) => {
      stopFetching(state);
      state.jobs[job.id] = normalizeJob(job);
    },

    deleteJob: startFetching,
    deleteJobSuccess(state, { payload: id }) {
      stopFetching(state);
      delete state.jobs[id];
    },

    clearJobs: (state) => {
      state.jobs = {};
    },

    clearJobTypes: (state) => {
      state.jobTypes = {};
    },

    clearJobFeatureExtraction: (state) => {
      state.jobsFeatureExtraction = {};
    },

    requestFail(state, { payload: { message } }) {
      stopFetching(state);
      state.error = message;
    },

    cancel: stopFetching,
  },

  sagas: (actions) => ({
    [actions.fetchJobTypes]: {
      * saga() {
        initApi();

        try {
          const url = `${baseUrl}/type`;
          const { data: { data: types } } = yield call(api.get, url);

          const responses = yield all(types.map((type) => call(api.get, `${url}/${type}`)));

          const jobTypes = responses.reduce((acc, el, i) => {
            const type = types[i];
            const { stages, ...blocks } = el.data.data;
            const mappedStages = Object.keys(stages).reduce((mapped, key, order) => {
              return {
                ...mapped,
                [key]: {
                  order,
                  name: stages[key],
                  blocks: blocks[key],
                },
              };
            }, {});
            return {
              ...acc,
              [type]: { name: type, description: '', stages: mappedStages },
            };
          }, {});
          yield put(actions.fetchJobTypesSuccess(jobTypes));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchJobFeatureExtraction]: {
      * saga() {
        initApi();

        try {
          const url = `${baseUrl}/find/feature_extraction/100`;
          const { data } = yield call(api.get, url);
          const result = (Array.isArray(data.data) ? data.data : [])
            .filter((job) => job.tasks.length > 0);

          yield put(actions.fetchJobFeatureExtractionSuccess(result));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchJobs]: {
      * saga() {
        initApi();

        try {
          const url = `${baseUrl}`;
          const { data } = yield call(api.get, url);
          const result = (Array.isArray(data.data) ? data.data : []).filter((job) => job.tasks.length > 0);
          yield put(actions.fetchJobsSuccess(result));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.createJob]: {
      * saga({ payload: job }) {
        initApi();

        try {
          const url = `${baseUrl}`;
          const { data } = yield call(api.post, url, job);
          yield put(actions.createJobSuccess(data.data));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.updateJob]: {
      * saga({ payload: job }) {
        initApi();

        try {
          const url = `${baseUrl}/${job.id}`;
          const { data } = yield call(api.put, url, job);
          yield put(actions.updateJobSuccess(data.data));
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
          yield put(actions.deleteJobSuccess(id));
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
      (state) => state.isFetching,
    ),

    getJobTypes: createSelector(
      [getState],
      (state) => state.jobTypes,
    ),

    getJobs: createSelector(
      [getState],
      (state) => state.jobs,
    ),

    getJobsByParams: () => createSelector(
      [getState],
      (state) => state.jobsFeatureExtraction,
    ),

    getJob: (id) => createSelector(
      [getState],
      (state) => state.jobs[id],
    ),
  }),
});

export const { actions, selectors } = slice;
export default slice;
