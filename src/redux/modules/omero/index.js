import { all, call, put } from 'redux-saga/effects';
import backendClient from '@/middleware/backendClient';
import { createSlice, createSelector, startFetching, stopFetching } from '@/redux/utils';

const initialState = {
  isFetching: false,
  projects: [],
  datasets: {},
  images: {},
  thumbnails: {},
  imagesDetails: {},
  error: '',
  omeroWeb: '',
};

let api;

const initApi = () => {
  if (!api) {
    api = backendClient();
  }
};

const baseUrl = '/omero';

const slice = createSlice({
  name: 'omero',
  initialState,
  reducers: {
    fetchProjects: startFetching,
    fetchProjectsSuccess: (state, { payload: { projects } }) => {
      stopFetching(state);
      state.projects = (projects || []);
    },

    fetchOmeroWeb: startFetching,
    setOmeroWeb: (state, { payload }) => {
      stopFetching(state);
      state.omeroWeb = payload;
    },

    fetchDatasets: startFetching,
    fetchDatasetsSuccess: (state, { payload: data }) => {
      stopFetching(state);
      state.datasets = { ...state.datasets, ...data };
    },

    fetchImages: startFetching,
    fetchImagesSuccess: (state, { payload: { datasetId, images } }) => {
      stopFetching(state);
      state.images[datasetId] = (images || []);
    },
    clearImages: (state, { payload: datasetId }) => {
      if (!datasetId) {
        return;
      }
      delete state.images[datasetId];
    },

    fetchImagesThumbnails: startFetching,
    fetchImagesThumbnailsSuccess: (state, { payload: data }) => {
      stopFetching(state);
      state.thumbnails = { ...state.thumbnails, ...data };
    },
    clearThumbnails: (state, { payload: ids }) => {
      if (!ids?.length) {
        return;
      }
      ids.forEach((id) => {
        delete state.thumbnails[id];
      });
    },

    fetchImagesDetails: startFetching,
    fetchImagesDetailsSuccess: (state, { payload: data }) => {
      stopFetching(state);
      data.forEach((item) => {
        state.imagesDetails[item.id] = item;
      });
    },
    clearImagesDetails: (state, { payload: ids }) => {
      if (!ids?.length) {
        return;
      }
      ids.forEach((id) => {
        delete state.imagesDetails[id];
      });
    },

    fetchImageDetails: startFetching,
    fetchImageDetailsSuccess: (state, { payload: { id, data } }) => {
      stopFetching(state);
      state.imagesDetails[id] = (data || {});
    },
    clearImageDetails: (state, { payload: id }) => {
      if (!id) {
        return;
      }
      delete state.imagesDetails[id];
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
          const url = `${baseUrl}/webclient/api/containers`;
          const { data } = yield call(api.get, url);
          yield put(actions.fetchProjectsSuccess(data));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchDatasets]: {
      * saga({ payload: projectIds }) {
        initApi();

        try {
          const responses = yield all(projectIds.map((id) => call(api.get, `${baseUrl}/webclient/api/datasets/?id=${id}`)));
          const data = responses.reduce((acc, response, index) => ({
            ...acc,
            ...response.data?.datasets.reduce((acc2, item) => ({ ...acc2, [item.id]: { ...item, project: projectIds[index] } }), {}),
          }), {});
          yield put(actions.fetchDatasetsSuccess(data));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchImages]: {
      * saga({ payload: id }) {
        initApi();

        try {
          const searchParams = new URLSearchParams('');
          searchParams.append('id', `${id}`);
          const url = `${baseUrl}/webclient/api/images/?${searchParams}`;
          const { data } = yield call(api.get, url);
          yield put(actions.fetchImagesSuccess({ datasetId: id, images: data.images }));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchImagesThumbnails]: {
      * saga({ payload: ids }) {
        initApi();

        try {
          const url = `${baseUrl}/webclient/get_thumbnails/?${ids.map((id) => `id=${id}`).join('&')}`;
          const { data } = yield call(api.get, url);
          yield put(actions.fetchImagesThumbnailsSuccess(data));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchImagesDetails]: {
      * saga({ payload: ids }) {
        initApi();

        try {
          const responses = yield all(ids.map((id) => call(api.get, `${baseUrl}/iviewer/image_data/${id}`)));
          const data = responses.map((response) => response.data);
          yield put(actions.fetchImagesDetailsSuccess(data));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchOmeroWeb]: {
      *saga() {
        initApi();

        try {
          const url = `${baseUrl}/omero_web`;
          const { data } = yield call(api.get, url);
          yield put(actions.setOmeroWeb(data.omero_web));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchImageDetails]: {
      * saga({ payload: id }) {
        initApi();

        try {
          const url = `${baseUrl}/iviewer/image_data/${id}`;
          const { data } = yield call(api.get, url);
          yield put(actions.fetchImageDetailsSuccess({ id, data }));
        } catch (error) {
          yield put(actions.requestFail(error));
          // eslint-disable-next-line no-console
          console.error(error.message);
        }
      },
    },

    [actions.fetchTail]: {
      * saga({ payload: id }) {
        initApi();

        try {
          const url = `${baseUrl}/iviewer/image_data/${id}`;
          const { data } = yield call(api.get, url);
          yield put(actions.fetchImageDetailsSuccess({ id, data }));
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

    getDatasets: (projectIds) => createSelector(
      [getState],
      (state) => Object.values(state.datasets).reduce((acc, item) => {
        if (projectIds.includes(item.project)) {
          acc[item.id] = item;
        }
        return acc;
      }, {}),
    ),

    getImages: (datasetId) => createSelector(
      [getState],
      (state) => state?.images[datasetId],
    ),

    getOmeroWeb: createSelector(
      [getState],
      (state) => state?.omeroWeb,
    ),

    getImagesThumbnails: (ids) => createSelector(
      [getState],
      (state) => ids.reduce((acc, id) => state.thumbnails[id] ? { ...acc, [id]: state.thumbnails[id] } : acc, {}),
    ),

    getImagesDetails: (ids) => createSelector(
      [getState],
      (state) => ids.reduce((acc, id) => state.imagesDetails[id] ? { ...acc, [id]: state.imagesDetails[id] } : acc, {}),
    ),

    getImageDetails: (id) => createSelector(
      [getState],
      (state) => state?.imagesDetails[id],
    ),
  }),
});

export const { actions, selectors } = slice;
export default slice;
