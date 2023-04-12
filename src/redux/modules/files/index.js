import { call, put } from 'redux-saga/effects';
import backendClient from '@/middleware/backendClient';
import { createSlice, createSelector, startFetching, stopFetching } from '@/redux/utils';


const initialState = {
  isFetching: false,
  error: '',
  files: {},
  selectedFile: null,
  fileKeys: {},
};

let api;

const initApi = () => {
  if (!api) {
    api = backendClient();
  }
};

const baseUrl = '/files';

const slice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    fetchFiles: startFetching,
    checkFile: startFetching,
    uploadFile: startFetching,
    deleteFile: startFetching,

    fetchFilesSuccess: (state, { payload: data }) => {
      stopFetching(state);
      const rootChildren = data.tree[''].children;
      state.files = rootChildren.map(child => {
        const [filename, fileData] = Object.entries(child)[0];
        return { filename, ...fileData };
      });
    },

    checkFileSuccess: (state, { payload: { fileName, keys } }) => {
      stopFetching(state);
      state.fileKeys[fileName] = keys; // Измените на добавление ключей для соответствующего имени файла
    },

    uploadFileSuccess: (state, { payload: file }) => {
      stopFetching(state);
      state.files[file.id] = file;
      state.selectedFile = file;
    },

    deleteFileSuccess(state, { payload: id }) {
      stopFetching(state);
      delete state.files[id];
    },

    clearFiles: (state) => {
      state.files = {};
    },

    requestFail(state, { payload: { message } }) {
      stopFetching(state);
      state.error = message;
    },

    cancel: stopFetching,
  },

  sagas: (actions) => ({
    [actions.fetchFiles]: {
      * saga() {
        initApi();

        try {
          const url = `${baseUrl}`;
          const { data } = yield call(api.get, url);
          yield put(actions.fetchFilesSuccess(data));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.checkFile]: {
      *saga({ payload: file }) {
        initApi();

        try {
          const url = `${baseUrl}/check-file?filename=${file.name}`;
          const { data } = yield call(api.get, url);
          yield put(actions.checkFileSuccess({ fileName: file.name, keys: data['keys'] }));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.uploadFile]: {
      * saga({ payload: file }) {
        initApi();

        try {
          const url = `${baseUrl}`;
          const formData = new FormData();
          formData.append('filenames', file);
          const { data } = yield call(api.post, url, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          yield put(actions.uploadFileSuccess(data.data));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.deleteFile]: {
      * saga({ payload: id }) {
        initApi();

        try {
          const url = `${baseUrl}/${id}`;
          yield call(api.delete, url);
          yield put(actions.deleteFileSuccess(id));
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

    getFiles: createSelector(
      [getState],
      (state) => state?.files,
    ),

    getFile: (id) => createSelector(
      [getState],
      (state) => state?.files[id],
    ),

    getFileKeys: createSelector(
      [getState],
      (state) => state?.fileKeys,
    ),
  }),
});

export const { actions, selectors } = slice;
export default slice;
