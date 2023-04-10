import { call, put } from 'redux-saga/effects';
import backendClient from '@/middleware/backendClient';
import { createSlice, createSelector, startFetching, stopFetching } from '@/redux/utils';

import hash from '@/shared/utils/hash';

const initialState = {
  isFetching: false,
  error: '',
  files: {},
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
    uploadFile: startFetching,
    deleteFile: startFetching,

    fetchFilesSuccess: (state, { payload: files }) => {
      stopFetching(state);
      state.files = hash(files || [], 'id');
    },

    uploadFileSuccess: (state, { payload: file }) => {
      stopFetching(state);
      state.files[file.id] = file;
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
          yield put(actions.fetchFilesSuccess(data.data));
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
        console.log('file', file);

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
  }),
});

export const { actions, selectors } = slice;
export default slice;
