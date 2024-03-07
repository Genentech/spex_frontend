import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import FolderIcon from '@material-ui/icons/Folder';
import PermMediaIcon from '@material-ui/icons/PermMedia';
import intersectionBy from 'lodash/intersectionBy';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { actions as omeroActions, selectors as omeroSelectors } from '@/redux/modules/omero';

import { Field, Controls, FormSpy } from '+components/Form';
import Parsers from '+components/Form/utils/Parsers';
import FormModalOrigin from '+components/FormModal';
import Content from '+components/Modal/components/Content';
import Select, { Group, Option } from '+components/Select';

import Row from '../../components/Row';

const none = 'none';

const FormModal = styled(FormModalOrigin)`
    ${Content} {
        min-width: 60vw;
    }
`;

const Icon = styled.span`
    display: inline-flex;
    align-items: center; 
    margin-right: 5px;
`;

const DatasetText = styled.span`
  display: inline-flex;
  align-items: center;
`;

const DatasetOptionWithIndent = styled(Option)`
  padding-left: 20px; 
`;

const ManageImagesFormModal = styled((props) => {
  const {
    className,
    header,
    initialValues,
    closeButtonText,
    submitButtonText,
    open,
    onClose,
    onSubmit,
  } = props;

  const dispatch = useDispatch();

  const [formValues, setFormValues] = useState(initialValues || {});
  const [omeroDatasetId, setOmeroDatasetId] = useState(none);

  const projects = useSelector(omeroSelectors.getProjects);
  const projectIds = useMemo(() => projects.map((item) => item.id), [projects]);
  const projectDatasets = useSelector(omeroSelectors.getDatasets(projectIds));
  const datasetImages = useSelector(omeroSelectors.getImages(omeroDatasetId));

  const datasetImagesIds = useMemo(() => (datasetImages || []).map((item) => item.id),[datasetImages]);
  const datasetImagesThumbnails = useSelector(omeroSelectors.getImagesThumbnails(datasetImagesIds));
  const datasetImagesDetails = useSelector(omeroSelectors.getImagesDetails(datasetImagesIds));

  const formImagesThumbnails = useSelector(omeroSelectors.getImagesThumbnails(formValues.omeroIds));
  const formImagesDetails = useSelector(omeroSelectors.getImagesDetails(formValues.omeroIds));

  const isOmeroFetching = useSelector(omeroSelectors.isFetching);

  const options = useMemo(
    () => {
      const formImagesChannels = Object.values(formImagesDetails).map((item) => item.channels);

      const formOptions = Object.entries(formImagesThumbnails || {}).map(([id, img]) => ({
        id,
        img,
        title: formImagesDetails[id]?.meta.imageName,
        description: `s: ${formImagesDetails[id]?.size.width} x ${formImagesDetails[id]?.size.height}, c: ${formImagesDetails[id]?.size.c}`,
      }));

      const datasetOptions = Object.entries(datasetImagesThumbnails || {}).reduce((acc, [id, img]) => formImagesThumbnails[id] ? acc : [...acc, {
        id,
        img,
        title: datasetImagesDetails[id]?.meta.imageName,
        description: `s: ${datasetImagesDetails[id]?.size.width} x ${datasetImagesDetails[id]?.size.height}, c: ${datasetImagesDetails[id]?.size.c}`,
        disabled: !intersectionBy(...formImagesChannels, datasetImagesDetails[id]?.channels, 'label').length,
      }], []);

      return [...datasetOptions, ...formOptions];
    },
    [datasetImagesThumbnails, formImagesThumbnails, datasetImagesDetails, formImagesDetails],
  );

  const onDatasetChange = useCallback(
    ({ target: { value } }) => {
      setOmeroDatasetId(value);
    },
    [],
  );

  const timer = useRef();
  const onFormChange = useCallback(
    ({ values }) => {
      timer.current = setTimeout(() => {
        setFormValues(values);
      }, 10);
    },
    [],
  );

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  useEffect(
    () => {
      if (projects.length) {
        return;
      }

      dispatch(omeroActions.fetchProjects());
    },
    [dispatch, projects.length],
  );

  useEffect(
    () => {
      if (!projectIds.length) {
        return;
      }

      dispatch(omeroActions.fetchDatasets(projectIds));
    },
    [dispatch, projectIds],
  );

  useEffect(
    () => {
      if (!omeroDatasetId || omeroDatasetId === none) {
        return undefined;
      }

      dispatch(omeroActions.fetchImages(omeroDatasetId));
    },
    [dispatch, omeroDatasetId],
  );

  useEffect(
    () => {
      if (!datasetImagesIds?.length) {
        return;
      }

      dispatch(omeroActions.fetchImagesThumbnails(datasetImagesIds));
      dispatch(omeroActions.fetchImagesDetails(datasetImagesIds));
    },
    [dispatch, datasetImagesIds],
  );

  useEffect(
    () => {
      if (!formValues.omeroIds?.length) {
        return;
      }

      dispatch(omeroActions.fetchImagesThumbnails(formValues.omeroIds));
      dispatch(omeroActions.fetchImagesDetails(formValues.omeroIds));
    },
    [dispatch, formValues.omeroIds],
  );

  return (
    <FormModal
      className={className}
      header={header}
      initialValues={initialValues}
      closeButtonText={closeButtonText}
      submitButtonText={submitButtonText}
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
    >
      <FormSpy
        subscription={{ values: true }}
        onChange={onFormChange}
      />

      <Row>
        <Select
          defaultValue={none}
          value={omeroDatasetId}
          onChange={onDatasetChange}
          disabled={isOmeroFetching}
        >
          <Option value={none}>Select Omero Dataset</Option>
          {projects?.reduce((acc, project) => ([
            ...acc,
            <Group key={`project-${project.id}`} style={{ display: 'flex', alignItems: 'center' }}>
              <Icon><FolderIcon /></Icon>
              <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '5px' }}>{project.name}</span>
            </Group>,
            ...Object.values(projectDatasets || {})
              .filter((dataset) => dataset.project === project.id)
              .map((dataset) => (
                <Option key={`dataset-${dataset.id}`} value={dataset.id}>
                  <DatasetOptionWithIndent key={`dataset-${dataset.id}`} value={dataset.id}>
                    <Icon><PermMediaIcon /></Icon>
                    <DatasetText>{dataset.name}</DatasetText>
                  </DatasetOptionWithIndent>
                </Option>
              )),
          ]), [])}
        </Select>
      </Row>

      <Row>
        <Field
          name="omeroIds"
          label="Omero IDs"
          component={Controls.TransferList}
          options={options}
          parse={Parsers.omeroIds}
        />
      </Row>
    </FormModal>
  );
})`
    ${Row} + ${Row} {
        margin-top: 20px;
    }

    .transfer-list {
        height: 300px;
        margin: 0 auto;
    }
`;

ManageImagesFormModal.propTypes = {
  /**
   * Override or extend the styles applied to the component.
   */
  className: PropTypes.string,
  /**
   * Modal title.
   */
  header: PropTypes.string,
  /**
   * Initial values.
   */
  initialValues: PropTypes.shape({}),
  /**
   * Text for the close button.
   */
  closeButtonText: PropTypes.string,
  /**
   * Text for the confirm button.
   */
  submitButtonText: PropTypes.string,
  /**
   * If true, the modal is open.
   */
  open: PropTypes.bool,
  /**
   * Callback fired when the component requests to be closed.
   */
  onClose: PropTypes.func,
  /**
   * A callback fired when data is changed.
   */
  onChange: PropTypes.func,
  /**
   * A callback fired when confirm button clicked.
   */
  onSubmit: PropTypes.func,
};

ManageImagesFormModal.defaultProps = {
  className: '',
  header: '',
  initialValues: null,
  closeButtonText: 'Cancel',
  submitButtonText: 'Submit',
  open: false,
  onClose: () => {},
  onSubmit: () => {},
};

export default ManageImagesFormModal;
