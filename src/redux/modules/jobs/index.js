import { all, call, put } from 'redux-saga/effects';
import backendClient from '@/middleware/backendClient';
import { actions as pipelineActions } from '@/redux/modules/pipelines';
import { createSlice, createSelector, startFetching, stopFetching } from '@/redux/utils';

import hash from '+utils/hash';

const initialState = {
  isFetching: false,
  error: '',
  jobs: {},
  jobTypes: {},
  jobsFeatureExtraction: {},
  jobs_zscore: {},
  pipeline_jobs: {},
  jobData: {},
};

let api;

const initApi = () => {
  if (!api) {
    api = backendClient();
  }
};

const baseUrl = '/jobs';

const isObject = (value) => value != null && typeof value === 'object' && !Array.isArray(value);

export const normalizeJob = (job) => {
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

    fetchJobData: startFetching,
    fetchJobDataSuccess: (state, { payload: { jobData, jobId } }) => {
      stopFetching(state);
      if (jobData) {
        state.jobData[jobId] = jobData;
      }
    },


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

    fetchJobZscore: startFetching,
    fetchJobZScoreSuccess: (state, { payload: { jobs, pipelineId } }) => {
      stopFetching(state);
      const normalizedJobs = jobs.map(normalizeJob);
      state.jobs_zscore[pipelineId] = hash(normalizedJobs || [], 'id');
    },

    fetchJobsByPipelineId: startFetching,
    fetchJobsByPipelineIdSuccess: (state, { payload: { jobs, pipelineId } }) => {
      stopFetching(state);
      const normalizedJobs = jobs.map(normalizeJob);
      state.pipeline_jobs[pipelineId] = hash(normalizedJobs || [], 'id');
    },


    fetchJobs: startFetching,
    fetchJobsSuccess: (state, { payload: jobs }) => {
      stopFetching(state);
      const normalizedJobs = jobs.map(normalizeJob);
      state.jobs = hash(normalizedJobs || [], 'id');
    },

    fetchJob: startFetching,
    fetchJobSuccess: (state, { payload: job }) => {
      stopFetching(state);
      if (job) {
        state.jobs[job.id] = normalizeJob(job);
      }
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

    startPipeline: startFetching,

    downloadJob: startFetching,
    downloadJobSuccess: stopFetching,

    clearJobs: (state) => {
      state.jobs = {};
    },

    clearJobTypes: (state) => {
      state.jobTypes = {};
    },

    clearJobFeatureExtraction: (state) => {
      state.jobsFeatureExtraction = {};
    },

    clearJobZScore: (state) => {
      state.jobs_zscore = {};
    },

    requestFail(state, { payload: { message } }) {
      stopFetching(state);
      state.error = message;
    },
    cancel: stopFetching,
  },

  sagas: (actions) => ({
    [actions.fetchJobData]: {
      * saga({ payload: id }) {
        initApi();

        try {
          const url = `${baseUrl}/merged_result/${id}?show_structure=True`;
          const { data } = yield call(api.get, url) || {};

          yield put(actions.fetchJobDataSuccess({ jobData: data, jobId: id }));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchJobTypes]: {
      * saga() {
        initApi();

        try {
          const url = `${baseUrl}/type`;
          const { data: { data: types } } = yield call(api.get, url);

          const responses = yield all(types.map((type) => call(api.get, `${url}/${type}`)));

          const scriptTypes = responses.reduce((acc, response, i) => {
            const { data: { data: scriptType } } = response;

            scriptType.stages.forEach((stage) => {
              stage.scripts.forEach((script) => {
                script.params_meta = script.params || {};
                script.params = Object.entries(script.params).reduce((acc, [key, value]) => ({
                  ...acc,
                  [key]: value.default,
                }), {});
              });
            });

            return {
              ...acc,
              [scriptType.key]: scriptType,
            };
          }, {});

          yield put(actions.fetchJobTypesSuccess(scriptTypes));
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
          const url = `${baseUrl}/find/?name=feature_extraction&status=100`;
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

    [actions.fetchJobZscore]: {
      * saga({ payload: pipelineId }) {
        initApi();

        try {
          const url = `${baseUrl}/find/?pipeline_id=${pipelineId}&name=zscore&name=transformation&status=100`;
          const { data } = yield call(api.get, url);
          const result = (Array.isArray(data.data) ? data.data : [])
            .filter((job) => job.tasks.length > 0);
          yield put(actions.fetchJobZScoreSuccess( { pipelineId, jobs: result } ));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchJobsByPipelineId]: {
      * saga({ payload: pipelineId }) {
        initApi();

        try {
          const url = `${baseUrl}/find/?pipeline_id=${pipelineId}`;
          const { data } = yield call(api.get, url);
          const result = (Array.isArray(data.data) ? data.data : [])
              .filter((job) => job.tasks.length > 0);
          yield put(actions.fetchJobsByPipelineIdSuccess( { pipelineId, jobs: result } ));

          const url2 = `/pipeline/${pipelineId}`;
          const data2 = yield call(api.get, url2);
          yield put(pipelineActions.fetchPipelinesSuccess({
            projectId: '', data: data2['data']['data']['pipelines'],
          }));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.startPipeline]: {
      * saga({ payload: pipelineId }) {
        initApi();

        try {
          const url = `${baseUrl}/find/?pipeline_id=${pipelineId}`;
          const { data } = yield call(api.put, url, { status: 0 });
          const result = (Array.isArray(data.data) ? data.data : [])
            .filter((job) => job.tasks.length > 0);
          yield put(actions.fetchJobsByPipelineIdSuccess({ pipelineId, jobs: result } ));

          const url2 = `/pipeline/${pipelineId}`;
          const data2 = yield call(api.get, url2);
          yield put(pipelineActions.fetchPipelinesSuccess({
            projectId: '', data: data2['data']['data']['pipelines'],
          }));
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

    [actions.fetchJob]: {
      * saga({ payload: id }) {
        initApi();

        try {
          const url = `${baseUrl}/${id}`;
          let { data: { data } = {} } = yield call(api.get, url) || {};

          data = Array.isArray(data) ? data : [data];
          [data] = data.filter((job) => job?.tasks?.length > 0);

          yield put(actions.fetchJobSuccess(data));
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
          return data.data;
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
          return data.data;
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

    [actions.downloadJob]: {
      * saga({ payload: { jobId, fileName } }) {
        initApi();

        try {
          const url = `${baseUrl}/anndata_result/${jobId}`;
          const { data } = yield call(api.get, url, { responseType: 'blob' });

          const downloadUrl = window.URL.createObjectURL(new Blob([data]));
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.setAttribute('download', fileName);
          document.body.appendChild(link);
          link.click();
          link.parentNode.removeChild(link);

          yield put(actions.downloadJobSuccess());
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

    getJobData: createSelector(
      [getState],
      (state) => state.jobData,
    ),

    getJobs: createSelector(
      [getState],
      (state) => state.jobs,
    ),

    getJobsByParams: () => createSelector(
      [getState],
      (state) => state.jobsFeatureExtraction,
    ),

    getJobsByPipeline: (pipelineId) => createSelector(
      [getState],
      (state) => state.jobs_zscore[pipelineId] || {},
    ),

    getJobsByPipelineId: (pipelineId) => createSelector(
        [getState],
        (state) => state.pipeline_jobs[pipelineId] || {},
    ),

    getJob: (id) => createSelector(
      [getState],
      (state) => state.jobs[id],
    ),

    isDownloadInProgress: createSelector(
      [getState],
      (state) => state.isFetching,
    ),
  }),
});

export const { actions, selectors } = slice;
export default slice;
