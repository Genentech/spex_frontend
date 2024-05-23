import { call, put } from 'redux-saga/effects';
import backendClient from '@/middleware/backendClient';
import { actions as jobsActions } from '@/redux/modules/jobs';
import { createSlice, createSelector, startFetching, stopFetching } from '@/redux/utils';
import hash from '+utils/hash';

const initialState = {
  isFetching: false,
  error: '',
  processes: [],
  processesOfProject: [],
  visProcesses: {},
};

let api;

const initApi = () => {
  if (!api) {
    api = backendClient();
  }
};

const baseUrl = '/pipeline';

const slice = createSlice({
  name: 'processes',
  initialState,
  reducers: {
    fetchProcesses: startFetching,
    fetchProcessesOfProject: startFetching,
    fetchProcessesForVis: startFetching,
    fetchProcess: startFetching,
    createProcess: startFetching,
    updateProcess: startFetching,
    deleteProcess: startFetching,
    createConn: startFetching,

    createJob: startFetching,
    updateJob: startFetching,
    deleteJob: startFetching,

    setSelectedOption: (state, { payload }) => {
      state.selectedOption = payload || 'settings';
    },

    fetchProcessesSuccess: (state, { payload: { projectId, data } }) => {
      stopFetching(state);
      let hashedProcesses = hash(data || [], 'id');

      if (Object.keys(hashedProcesses).length > 0) {
        state.processes = hashedProcesses;
      }
    },

    fetchProcessesOfProjectSuccess: (state, { payload: { projectId, data } }) => {
      stopFetching(state);
      let hashedProcessesOfProject = hash(data || [], 'id');

      if (Object.keys(hashedProcessesOfProject).length > 0) {
        state.processesOfProject = hashedProcessesOfProject;
      }
    },

    fetchProcessesForVisSuccess: (state, { payload: { data } }) => {
      stopFetching(state);
      if (data?.length > 0 && data[0].jobs?.length > 0) {
        state.visProcesses[data[0].id] = data[0];
      }
    },

    createProcessSuccess: (state, { payload: process }) => {
      stopFetching(state);
      state.processes[process.id] = process;
    },

    updateProcessSuccess: (state, { payload: process }) => {
      stopFetching(state);
      state.processes[process.id] = process;
    },

    deleteProcessSuccess(state, { payload: [processId] }) {
      stopFetching(state);
      delete state.processes[processId];
    },

    createJobSuccess: (state, { payload: { jobs, processId } }) => {
      stopFetching(state);
    },

    updateJobSuccess: (state) => {
      stopFetching(state);
    },

    deleteJobSuccess: (state) => {
      stopFetching(state);
    },

    clearProcesses: (state) => {
      state.processes = {};
    },

    requestFail(state, { payload: { message } }) {
      stopFetching(state);
      state.error = message;
    },

    cancel: stopFetching,
  },

  sagas: (actions) => ({
    [actions.fetchProcesses]: {
      * saga({ payload: projectId }) {
        initApi();

        try {
          const url = `${baseUrl}s/${projectId}`;
          const { data } = yield call(api.get, url);
          yield put(actions.fetchProcessesSuccess({ projectId: projectId, data: data.data['pipelines'] }));
          yield put(actions.fetchProcessesOfProjectSuccess({ projectId: projectId, data: data.data['pipelines'] }));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchProcessesOfProject]: {
      * saga({ payload: projectId }) {
        initApi();

        try {
          const url = `${baseUrl}s/${projectId}`;
          const { data } = yield call(api.get, url);
          yield put(actions.fetchProcessesOfProjectSuccess({ projectId: projectId, data: data.data['pipelines'] }));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchProcessesForVis]: {
      * saga({ payload: { projectId, processId } }) {
        initApi();
        try {
          let url = `projects/${projectId}/list`;
          if (processId) {
            url += `?pipeline_id=${processId}`;
          }
          const { data } = yield call(api.get, url);
          yield put(actions.fetchProcessesForVisSuccess({ data: data['data'] }));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchProcess]: {
      * saga({ payload: { projectId, processId } }) {
        initApi();

        try {
          const url = `${baseUrl}/${processId}`;
          const { data } = yield call(api.get, url);
          yield put(actions.fetchProcessesSuccess({ projectId, data: data.data['pipelines'] }));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.createProcess]: {
      * saga({ payload: process }) {
        initApi();

        try {
          const url = `${baseUrl}s/${process.project}`;
          const { data } = yield call(api.post, url, process);
          yield put(actions.createProcessSuccess(data.data));
          yield put(actions.fetchProcesses(process.project));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.updateProcess]: {
      * saga({ payload: process }) {
        initApi();

        try {
          const url = `${baseUrl}/${process.id}`;
          const { data } = yield call(api.put, url, process);
          yield put(actions.updateProcessSuccess(data.data));
          yield put(actions.fetchProcesses(process.project));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.deleteProcess]: {
      * saga({ payload: [projectId, processId] }) {
        initApi();
        try {
          const url = `${baseUrl}/${processId}`;
          yield call(api.delete, url);
          yield put(actions.deleteProcessSuccess([projectId, processId]));
          yield put(actions.fetchProcesses(projectId));
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

          const processUrl = `${baseUrl}/link/${job.rootId ?? job.processId}/${job_id}/${job.processId}`;
          yield call(api.post, processUrl);

          yield put(actions.fetchProcess({
            projectId: job.projectId,
            processId: job.processId,
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

          const processUrl = `${baseUrl}/link/${job.rootId ?? job.processId}/${data.data.id}/${job.processId}`;
          yield call(api.post, processUrl);

          yield put(actions.fetchProcess({
            projectId: job.projectId,
            processId: job.processId,
          }));

          yield put(actions.createJobSuccess( { jobs: [job], processId: job.processId } ));
          yield put(actions.fetchProcess({
            projectId: job.projectId,
            processId: job.processId,
          }));

          yield put(jobsActions.fetchJobsByProcessId(job.processId));
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

          yield put(actions.fetchProcess({
            projectId: job.projectId,
            processId: job.processId,
          }));

          yield put(jobsActions.fetchJobsByProcessId(job.processId));

          yield put(actions.updateJobSuccess());
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.deleteJob]: {
      * saga({ payload: { projectId, processId, jobId } }) {
        initApi();
        try {
          const processUrl = `${baseUrl}/link/${processId}/${jobId}`;
          yield call(api.delete, processUrl);

          const jobUrl = `/jobs/${jobId}`;

          yield call(api.delete, jobUrl);
          yield put(jobsActions.deleteJobSuccess(jobId));
          yield put(actions.fetchProcess({ projectId, processId }));

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

    getProcesses: (projectId) => createSelector(
      [getState],
      (state) => state?.processes,
    ),

    getProcessesOfProject: () => createSelector(
      [getState],
      (state) => state?.processesOfProject,
    ),

    getProcessesWithTasksForVis: (processId) => createSelector(
      [getState],
      (state) => state?.visProcesses[processId],
    ),

    getProcess: (projectId, processId) => createSelector(
      [getState],
      (state) => state?.processes[processId],
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
