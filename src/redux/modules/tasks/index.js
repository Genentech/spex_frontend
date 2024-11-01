import { all, call, put } from 'redux-saga/effects';
import backendClient from '@/middleware/backendClient';
import { createSelector, createSlice, startFetching, stopFetching } from '@/redux/utils';
import hash from '+utils/hash';


const initialState = {
  isFetching: false,
  error: '',
  tasks: {},
  tasksMessage: {},
  varNames: [],
  clusters: [],
  images: {},
  taskKeys: {},
  results: {},
  vis: {},
  vt_config: {},
  cluster_channels: {},
};

const {
  REACT_APP_BACKEND_URL_ROOT,
} = process.env;

const replaceURLRootInObject = (obj) => {
  for (let key in obj) {
    if (typeof obj[key] === 'string') {
      let replacedString = obj[key].replace('REACT_APP_BACKEND_URL_ROOT', `${REACT_APP_BACKEND_URL_ROOT}/`);
      if (replacedString !== obj[key]) {
        obj[key] = `${replacedString}/noCache=${new Date().getTime()}`;
      }
    } else if (Array.isArray(obj[key])) {
      obj[key].forEach((item) => {
        if (typeof item === 'object' && item !== null) {
          replaceURLRootInObject(item);
        }
      });
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      replaceURLRootInObject(obj[key]);
    }
  }
  return obj;
};

let api;

const initApi = () => {
  if (!api) {
    api = backendClient();
  }
};

const sleep = (milliseconds) => {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
};

const baseUrl = '/tasks';

const isObject = (value) => value != null && typeof value === 'object' && !Array.isArray(value);

const normalizeTask = (task) => {
  let content;
  try {
    content = JSON.parse(task.content);
  } catch(e) {
    content = {};
  }
  content = isObject(content) ? content : {};
  return { ...task, content };
};

const saveFile = (blob, fileName) => new Promise((resolve) => {
  if (navigator.msSaveOrOpenBlob) {
    navigator.msSaveOrOpenBlob(blob, fileName);
    resolve();
    return;
  }

  const listener = (e) => {
    resolve();
    window.removeEventListener('focus', listener, true);
  };

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();

  window.addEventListener('focus', listener, true);

  setTimeout(() => {
    URL.revokeObjectURL(a.href);
  }, 0);
});

const loadDataFrame = (str, delimiter = ',') => {
  let headers = str.slice(0, str.indexOf('\n')).split(delimiter);
  const rows = str.slice(str.indexOf('\n') + 1).split('\n');

  let res_arr = [];
  headers = headers.map(function (row) {
    return row.replace('\r', '');
  });

  res_arr = rows.map(function (row) {
    const values = row.split(delimiter);
    res_arr = values.map(function (val) {
      return parseFloat(val.replace('\r', ''));
    });
    return res_arr;
  });

  return [headers, ...res_arr];
};

const transformChannels = (array) => {
  return array.map((item) => {
    const label = item.label;
    let transformedLabel = label;

    if (label.startsWith('Target:')) {
      transformedLabel = label.substring('Target:'.length);
    }

    transformedLabel = transformedLabel.replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();

    return transformedLabel;
  });
};

const slice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    fetchTasksByIds: startFetching,
    fetchTasks: startFetching,
    fetchTaskImage: startFetching,
    fetchTaskKeys: startFetching,
    fetchTaskVitessce: startFetching,
    fetchTaskResult: startFetching,
    fetchTaskResultOnImage: startFetching,
    fetchTaskVisualize: startFetching,
    createTask: startFetching,
    updateTask: startFetching,
    deleteTask: startFetching,
    deleteTaskData: startFetching,
    checkTaskData: startFetching,
    getVarNames: startFetching,
    getClusters: startFetching,
    saveZarrData: startFetching,

    fetchTasksSuccess: (state, { payload: tasks }) => {
      stopFetching(state);
      const normalizedTasks = (Array.isArray(tasks) ? tasks : []).map(normalizeTask);
      state.tasks = hash(normalizedTasks, 'id');
    },

    fetchTaskImageSuccess: (state, { payload: { id, image } }) => {
      stopFetching(state);
      state.images[id] = image;
    },

    fetchTaskVitessceSuccess: (state, { payload: { id, config } }) => {
      stopFetching(state);
      // eslint-disable-next-line no-console
      console.log(config);
      state.vt_config[id] = config;
    },

    fetchTaskKeysSuccess: (state, { payload: task }) => {
      stopFetching(state);
      state.tasks[task.id] = normalizeTask(task);
    },

    fetchTaskResultSuccess: (state, { payload: { id, key, arr } }) => {
      stopFetching(state);
      state.results[id] = state.results[id] || {};
      state.results[id][key] = arr;
      },

    fetchTaskVisSuccess: (state, { payload: { id, visName, data } }) => {
      stopFetching(state);
      state.vis[id] = state.vis[id] || {};
      state.vis[id][visName] = data;
    },

    updateTaskSuccess: (state, { payload: task }) => {
      stopFetching(state);
      state.tasks[task.id] = normalizeTask(task);
    },

    createTaskSuccess: (state, { payload: task }) => {
      stopFetching(state);
      state.tasks[task.id] = normalizeTask(task);
    },

    deleteTaskSuccess(state, { payload: id }) {
      stopFetching(state);
      delete state.tasks[id];
    },

    deleteTaskDataSuccess(state, { payload: data }) {
      stopFetching(state);
      state.tasksMessage = data;
    },

    updateTaskDataSuccess(state, { payload: data }) {
      stopFetching(state);
      state.tasksMessage = data;
    },

    updateZarrDataSuccess(state, { payload: data }) {
      stopFetching(state);
      state.varNames = data.data;
      state.clusters = data.clusters;
    },

    clearTasks: (state) => {
      state.tasks = {};
    },

    clearTaskImage: (state, { payload: id }) => {
      if (!id) {
        return;
      }
      delete state.images[id];
    },

    requestFail(state, { payload: { message } }) {
      stopFetching(state);
      state.error = message;
    },

    cancel: stopFetching,
  },

  sagas: (actions) => ({
    [actions.fetchTasks]: {
      * saga() {
        initApi();

        try {
          const url = `${baseUrl}`;
          const { data: { data } } = yield call(api.get, url);
          yield put(actions.fetchTasksSuccess(data));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchTasksByIds]: {
      * saga({ payload: ids }) {
        initApi();

        try {
          const url = `${baseUrl}/list`;
          const { data: { data } } = yield call(api.post, url, { ids });
          yield put(actions.fetchTasksSuccess(data));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchTaskImage]: {
      * saga({ payload: id }) {
        initApi();

        try {
          const url = `${baseUrl}/image/${id}`;
          const { data: { data: { image } } } = yield call(api.get, url);
          yield put(actions.fetchTaskImageSuccess({ id, image }));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchTaskVitessce]: {
      * saga({ payload: id }) {
        initApi();

        try {
          const url = `${baseUrl}/vitessce/${id}`;
          const { data } = yield call(api.get, url);
          yield put(actions.fetchTaskVitessceSuccess({ id, config: replaceURLRootInObject(data) }));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchTaskKeys]: {
      * saga({ payload: id }) {
        initApi();

        try {
          const url_keys = `${baseUrl}/file/${id}`;
          const url_tasks = `${baseUrl}/${id}`;

          const [
            { data: { data: keys } },
            { data: { data: task } },
          ] = yield all([
            call(api.get, url_keys),
            call(api.get, url_tasks),
          ]);

          task.keys = keys;

          yield put(actions.fetchTaskKeysSuccess(task));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchTaskResult]: {
      * saga({ payload: { id, key } }) {
        initApi();

        try {
          let url_keys = `${baseUrl}/file/${id}?key=${key}`;
          if (key === 'dataframe') {
            url_keys = `${baseUrl}/anndata/${id}`;
          }

          const res = yield call(api.get, url_keys, { responseType: 'blob' });

          const type = res.data.type;

          let value;

          if (type === 'application/json') {
            value = yield res.data.text();
            const { data, message } = JSON.parse(value);

            value = data || (message && `Error at converting: ${message}`);
          } else {
            yield put(actions.fetchTaskResultSuccess({ id, key, value: 'Open save dialog...' }));
            let ext = type.split('/')[1];
            if (ext === 'vnd.ms-excel') {
              ext = 'csv';
            } else if (ext === 'octet-stream') {
              ext = 'h5ad';
            }
            yield saveFile(res.data, `${id}_result_${key}.${ext}`);
          }

          yield put(actions.fetchTaskResultSuccess({ id, key, value }));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchTaskResultOnImage]: {
      * saga({ payload: { id, key } }) {
        initApi();

        try {
          const url_keys = `${baseUrl}/file/${id}?key=${key}`;

          const res = yield call(api.get, url_keys, { responseType: 'blob' });

          const type = res.data.type;

          let value;
          let arr = [];

          if (type === 'application/json') {
            value = yield res.data.text();
            const { data, message } = JSON.parse(value);

            value = data || (message && `Error at converting: ${message}`);
          } else {
            value = yield res.data.text();
            arr = loadDataFrame(value);
          }
          yield put(actions.fetchTaskResultSuccess({ id, key, arr }));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchTaskVisualize]: {
      * saga({ payload: { id, name, key, script, channels = [] } }) {
        let visList = [];
        if (script === 'segmentation' || script === 'cell_seg') {
          const labels_list = ['load_tiff, background_subtract'];
          if (labels_list.includes(name)) {
            // skipping
            visList = ['image'];
          } else if (name === 'feature_extraction') {
            visList = ['boxplot', 'scatter'];
          } else {
            visList = ['labels'];
          }
        } else if (script === 'clustering') {
          if (['transformation', 'zscore'].includes(name) && name) {
            visList = ['image'];
          } else if (name === 'cluster') {
            visList = ['heatmap', 'violin', 'scatter'];
          } else if (name === 'dml') {
            visList = ['scatter'];
          } else if (name === 'qfmatch') {
            visList = ['scatter'];
          } else {
            visList = ['heatmap', 'barplot', 'scatter'];
          }
        } else if (script === 'CellCell') {
          if (name === 'CellCell') {
            visList = ['heatmap'];
          }
        } else if (script === 'spatial') {
          if (name === 'spatial') {
            visList = ['scatter'];
          }
        }

        const channels_map = transformChannels(channels);

        try {
          initApi();
          for (let i = 0; i < visList.length; i++) {
            let visName = visList[i];
            let channel_str = '';
            if ((channels_map.length) > 0) {
              channel_str = `&marker_list=${channels_map.join(',')}`;
            }
            let url_keys = `${baseUrl}/vis/${id}?key=${key}&vis_name=${visName}${channel_str}`;
            let res = yield call(api.get, url_keys, { responseType: 'blob' });
            let data = yield res.data.text();
            yield put(actions.fetchTaskVisSuccess({ id, visName, data }));
            sleep(1000);
          }
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.createTask]: {
      * saga({ payload: task }) {
        initApi();

        try {
          const url = `${baseUrl}`;
          const { data: { data } } = yield call(api.post, url, task);
          yield put(actions.createTaskSuccess(data));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.updateTask]: {
      * saga({ payload: task }) {
        initApi();

        try {
          const url = `${baseUrl}/${task.id}`;
          const { data: { data } } = yield call(api.put, url, task);
          yield put(actions.updateTaskSuccess(data));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.deleteTask]: {
      * saga({ payload: id }) {
        initApi();

        try {
          const url = `${baseUrl}/${id}`;
          yield call(api.delete, url);
          yield put(actions.deleteTaskSuccess(id));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.deleteTaskData]: {
      * saga({ payload: id }) {
        initApi();

        try {
          const url = `${baseUrl}/vitessce/${id}`;
          const { data } = yield call(api.delete, url);
          yield put(actions.deleteTaskDataSuccess(data));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.checkTaskData]: {
      * saga({ payload: id }) {
        initApi();

        try {
          const url = `${baseUrl}/vitessce/${id}`;
          const { data } = yield call(api.post, url, {});
          yield put(actions.updateTaskDataSuccess(data));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.getVarNames]: {
      * saga({ payload: id }) {
        initApi();

        try {
          const url = `${baseUrl}/zarr_structure/${id}`;
          const { data } = yield call(api.get, url, {});
          yield put(actions.updateZarrDataSuccess(data));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.saveZarrData]: {
      * saga({ payload: { id, selectedValues, rows } }) {
        initApi();
        try {
          const clusterList = rows.map((item) => ({ [item.c1]: item.c2 }));
          const url = `${baseUrl}/zarr_structure/${id}`;
          const response = yield call(api.post, url, { data: selectedValues, clusters: clusterList });
          yield put(actions.updateZarrDataSuccess(response.data));
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

    getTasks: createSelector(
      [getState],
      (state) => state?.tasks,
    ),

    getVarNames: createSelector(
      [getState],
      (state) => state?.varNames,
    ),

    getClusters: createSelector(
      [getState],
      (state) => state?.clusters,
    ),

    getResults: createSelector(
      [getState],
      (state) => state?.results,
    ),

    getTask: (id) => createSelector(
      [getState],
      (state) => state?.tasks?.[id],
    ),

    getDataMessage: createSelector(
      [getState],
      (state) => state?.tasksMessage,
    ),

    getTaskImage: (id) => createSelector(
      [getState],
      (state) => state?.images?.[id],
    ),

    getTaskKeys: (id) => createSelector(
      [getState],
      (state) => state?.taskKeys?.[id],
    ),

    getTaskVitessceConfig: (id) => createSelector(
      [getState],
      (state) => state?.vt_config?.[id],
    ),

    getTaskClusterChannels: (id) => createSelector(
      [getState],
      (state) => state?.cluster_channels?.[id],
    ),

    getTaskVitessceConfigs: createSelector(
      [getState],
      (state) => state?.vt_config,
    ),

    getTasksClusterChannels: createSelector(
      [getState],
      (state) => state?.cluster_channels,
    ),

    getTaskResults: (id) => createSelector(
      [getState],
      (state) => state?.results[id],
    ),

    getSelectedTask: createSelector(
      [getState],
      (state) => state?.results.currentTask,
    ),

    getTaskVisualizations: createSelector(
      [getState],
      (state) => state?.vis,
    ),

  }),
});

export const { actions, selectors } = slice;
export default slice;
