import { call, put } from 'redux-saga/effects';
import backendClient from '@/middleware/backendClient';
import { actions as jobsActions } from '@/redux/modules/jobs';
import { createSlice, createSelector, startFetching, stopFetching } from '@/redux/utils';
import hash from '+utils/hash';

const initialState = {
  isFetching: false,
  error: '',
  pipelines: [],
  pipelinesOfProject: [],
  visPipelines: {},
};

let api;

const initApi = () => {
  if (!api) {
    api = backendClient();
  }
};

const baseUrl = '/pipeline';

const slice = createSlice({
  name: 'pipelines',
  initialState,
  reducers: {
    fetchPipelines: startFetching,
    fetchPipelinesOfProject: startFetching,
    fetchPipelinesForVis: startFetching,
    fetchPipeline: startFetching,
    createPipeline: startFetching,
    updatePipeline: startFetching,
    deletePipeline: startFetching,
    createConn: startFetching,

    createJob: startFetching,
    updateJob: startFetching,
    deleteJob: startFetching,

    setSelectedOption: (state, { payload }) => {
      state.selectedOption = payload || 'settings';
    },

    fetchPipelinesSuccess: (state, { payload: { projectId, data } }) => {
      stopFetching(state);
      let hashedPipelines = hash(data || [], 'id');

      if (Object.keys(hashedPipelines).length > 0) {
        state.pipelines = hashedPipelines;
      }
    },

    fetchPipelinesOfProjectSuccess: (state, { payload: { projectId, data } }) => {
      stopFetching(state);
      let hashedPipelinesOfProject = hash(data || [], 'id');

      if (Object.keys(hashedPipelinesOfProject).length > 0) {
        state.pipelinesOfProject = hashedPipelinesOfProject;
      }
    },

    fetchPipelinesForVisSuccess: (state, { payload: { data } }) => {
      stopFetching(state);
      if (data?.length > 0 && data[0].jobs?.length > 0) {
        state.visPipelines[data[0].id] = data[0];
      }
    },

    createPipelineSuccess: (state, { payload: pipeline }) => {
      stopFetching(state);
      state.pipelines[pipeline.id] = pipeline;
    },

    updatePipelineSuccess: (state, { payload: pipeline }) => {
      stopFetching(state);
      state.pipelines[pipeline.id] = pipeline;
    },

    deletePipelineSuccess(state, { payload: [pipelineId] }) {
      stopFetching(state);
      delete state.pipelines[pipelineId];
    },

    createJobSuccess: (state, { payload: { jobs, pipelineId } }) => {
      stopFetching(state);
    },

    updateJobSuccess: (state) => {
      stopFetching(state);
    },

    deleteJobSuccess: (state) => {
      stopFetching(state);
    },

    clearPipelines: (state) => {
      state.pipelines = {};
    },

    requestFail(state, { payload: { message } }) {
      stopFetching(state);
      state.error = message;
    },

    cancel: stopFetching,
  },

  sagas: (actions) => ({
    [actions.fetchPipelines]: {
      * saga({ payload: projectId }) {
        initApi();

        try {
          const url = `${baseUrl}s/${projectId}`;
          const { data } = yield call(api.get, url);
          yield put(actions.fetchPipelinesSuccess({ projectId: projectId, data: data.data['pipelines'] }));
          yield put(actions.fetchPipelinesOfProjectSuccess({ projectId: projectId, data: data.data['pipelines'] }));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchPipelinesOfProject]: {
      * saga({ payload: projectId }) {
        initApi();

        try {
          const url = `${baseUrl}s/${projectId}`;
          const { data } = yield call(api.get, url);
          yield put(actions.fetchPipelinesOfProjectSuccess({ projectId: projectId, data: data.data['pipelines'] }));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchPipelinesForVis]: {
      * saga({ payload: { projectId, pipelineId } }) {
        initApi();
        try {
          let url = `projects/${projectId}/list`;
          if (pipelineId) {
            url += `?pipeline_id=${pipelineId}`;
          }
          const { data } = yield call(api.get, url);
          yield put(actions.fetchPipelinesForVisSuccess({ data: data['data'] }));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchPipeline]: {
      * saga({ payload: { projectId, pipelineId } }) {
        initApi();

        try {
          const url = `${baseUrl}/${pipelineId}`;
          const { data } = yield call(api.get, url);
          yield put(actions.fetchPipelinesSuccess({ projectId, data: data.data['pipelines'] }));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.createPipeline]: {
      * saga({ payload: pipeline }) {
        initApi();

        try {
          const url = `${baseUrl}s/${pipeline.project}`;
          const { data } = yield call(api.post, url, pipeline);
          yield put(actions.createPipelineSuccess(data.data));
          yield put(actions.fetchPipelines(pipeline.project));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.updatePipeline]: {
      * saga({ payload: pipeline }) {
        initApi();

        try {
          const url = `${baseUrl}/${pipeline.id}`;
          const { data } = yield call(api.put, url, pipeline);
          yield put(actions.updatePipelineSuccess(data.data));
          yield put(actions.fetchPipelines(pipeline.project));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.deletePipeline]: {
      * saga({ payload: [projectId, pipelineId] }) {
        initApi();
        try {
          const url = `${baseUrl}/${pipelineId}`;
          yield call(api.delete, url);
          yield put(actions.deletePipelineSuccess([projectId, pipelineId]));
          yield put(actions.fetchPipelines(projectId));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.createConn]: {
      * saga({ payload: job }) {
        initApi();
        try {
          const [job_id] = job.params?.job || [];

          if (job_id == null) {
            throw new Error('Job cannot be empty');
          }

          const pipelineUrl = `${baseUrl}/link/${job.rootId ?? job.pipelineId}/${job_id}/${job.pipelineId}`;
          yield call(api.post, pipelineUrl);

          yield put(actions.fetchPipeline({
            projectId: job.projectId,
            pipelineId: job.pipelineId,
          }));
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
          const jobUrl = '/jobs';
          const createParams = {
            name: job.name,
            file_names: job.file_names,
            params: job.params,
            omeroIds: job.omeroIds,
            content: 'empty',
          };

          const { data } = yield call(api.post, jobUrl, createParams);
          yield put(jobsActions.createJobSuccess(data.data));

          const pipelineUrl = `${baseUrl}/link/${job.rootId ?? job.pipelineId}/${data.data.id}/${job.pipelineId}`;
          yield call(api.post, pipelineUrl);

          yield put(actions.fetchPipeline({
            projectId: job.projectId,
            pipelineId: job.pipelineId,
          }));

          yield put(actions.createJobSuccess( { jobs: [job], pipelineId: job.pipelineId } ));
          yield put(actions.fetchPipeline({
            projectId: job.projectId,
            pipelineId: job.pipelineId,
          }));

          yield put(jobsActions.fetchJobsByPipelineId(job.pipelineId));
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
          const updateParams = {
            name: job.name,
            // folder: job.folder,
            // script: job.script,
            file_names: job.file_names,
            params: job.params,
            omeroIds: job.omeroIds,
            content: 'empty',
            status: job.status,
          };
          const jobUrl = `/jobs/${job.id}`;
          const { data } = yield call(api.put, jobUrl, updateParams);
          yield put(jobsActions.updateJobSuccess(data.data));

          yield put(actions.fetchPipeline({
            projectId: job.projectId,
            pipelineId: job.pipelineId,
          }));

          yield put(jobsActions.fetchJobsByPipelineId(job.pipelineId));

          yield put(actions.updateJobSuccess());
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.deleteJob]: {
      * saga({ payload: { projectId, pipelineId, jobId } }) {
        initApi();
        try {
          const pipelineUrl = `${baseUrl}/link/${pipelineId}/${jobId}`;
          yield call(api.delete, pipelineUrl);

          const jobUrl = `/jobs/${jobId}`;

          yield call(api.delete, jobUrl);
          yield put(jobsActions.deleteJobSuccess(jobId));
          yield put(actions.fetchPipeline({ projectId, pipelineId }));

          yield put(actions.deleteJobSuccess());
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

    getPipelines: (projectId) => createSelector(
      [getState],
      (state) => state?.pipelines,
    ),

    getPipelinesOfProject: () => createSelector(
      [getState],
      (state) => state?.pipelinesOfProject,
    ),

    getPipelinesWithTasksForVis: (pipelineId) => createSelector(
      [getState],
      (state) => state?.visPipelines[pipelineId],
    ),

    getPipeline: (projectId, pipelineId) => createSelector(
      [getState],
      (state) => state?.pipelines[pipelineId],
    ),

    getSelectedOption: createSelector(
      [getState],
      (state) => state?.selectedOption || 'settings',
    ),

  }),
});

export const { actions, selectors } = slice;
export const { setSelectedOption } = actions;
export default slice;
