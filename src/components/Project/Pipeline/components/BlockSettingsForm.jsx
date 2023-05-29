/* eslint-disable react/jsx-sort-default-props */
import React, { useState, useMemo, useEffect } from 'react';
import GetAppIcon from '@material-ui/icons/GetApp';
import Refresh from '@material-ui/icons/Refresh';
import Repeat from '@material-ui/icons/Repeat';
import createFocusOnFirstFieldDecorator from 'final-form-focus-on-first-field';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';


import { actions as omeroActions, selectors as omeroSelectors } from '@/redux/modules/omero';

import { selectors as projectsSelectors } from '@/redux/modules/projects';
import { selectors as tasksSelectors } from '@/redux/modules/tasks';
import Button, { ButtonColors } from '+components/Button';
import Form, { Controls, Field, FormRenderer, Validators, Parsers } from '+components/Form';
import ImageViewer from '+components/ImageViewer';
import NoData from '+components/NoData';
import { ScrollBarMixin } from '+components/ScrollBar';
import ThumbnailsViewer from '+components/ThumbnailsViewer';
import statusFormatter from '+utils/statusFormatter';

const Container = styled.div`
  width: 100%;
  height: 100%;

  form {
    width: 100%;
    height: 100%;
  }
`;

const Header = styled.div`
  font-size: 1.5em;
  font-weight: bold;
  text-transform: capitalize;

  :empty {
    display: none;
  }
`;

const Body = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;
  overflow-x: hidden;
  overflow-y: scroll;

  ${ScrollBarMixin};

  gap: 20px;
`;

const LeftPanel = styled.div`
  padding: 20px 0;

  display: flex;
  flex-direction: column;
  width: 60%;
  height: 100%;
  overflow: hidden;
`;

const RightPanel = styled.div`
  padding: 20px 0;

  width: 40%;
  height: 100%;

  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: scroll;

  ${ScrollBarMixin};

  gap: 20px;

  :only-child {
    width: 100%;
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  :empty {
    display: none;
  }

  .MuiButton-root + .MuiButton-root {
    margin-left: 15px;
  }
`;

const ImageViewerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #ccc;
  border-radius: 4px;
  //overflow: hidden;
`;

const TextField = styled(Controls.TextField)`
  max-width: 300px;
`;

const NumberField = styled(Controls.NumberField)`
  max-width: 300px;
`;

const Select = styled(Controls.SelectNew)`
  max-width: 300px;
`;

const getFieldComponent = (type) => {
  switch (type) {
    case 'omero':
      return Controls.TransferList;
    case 'job_id':
      return Controls.SelectJobs;
    case 'pipeline_job_id':
      return Controls.SelectJobsPipeline;
    case 'file':
      return Controls.SingleTransferList;
    case 'channel':
    case 'channels':
      return Select;
    case 'int':
    case 'float':
      return NumberField;
    case 'string':
    default:
      return TextField;
  }
};

const getFieldParser = (type) => {
  switch (type) {
    case 'omero':
      return Parsers.omeroIds;
    case 'channels':
      return Parsers.channels;
    case 'channel':
      return Parsers.channel;
    case 'int':
      return Parsers.number;
    case 'file':
      return Parsers.file;
    default:
      return undefined;
  }
};

const getFieldAdditionalProps = (type, block, { imagesOptions, imagesChannelsOptions, filesOptions }) => {
  switch (type) {
    case 'omero':
      return { options: imagesOptions };
    case 'channels':
      return { options: imagesChannelsOptions };
    case 'channel':
      return {
        onlyOneValue: true,
        inputValue: imagesChannelsOptions,
      };
    case 'file':
      return {
        options: filesOptions,
        file_names:  block.file_names,
      };

    default:
      return {};
  }
};

const focusOnFirstFieldDecorator = createFocusOnFirstFieldDecorator();

// TODO: Hardcode results
// [, label, centroid-0, centroid-1, 0],
let res = [
  ['label', 'centroid-0', 'centroid-1', 0],
];

const BlockSettingsForm = (props) => {
  const {
    className,
    children,
    block,
    onClose,
    onSubmit,
    onRestart,
    onReload,
    onForm,
    onDownload,
    onLoadKeys,
    ...tail
  } = props;

  const dispatch = useDispatch();
  const project = useSelector(projectsSelectors.getProject(block.projectId));
  const projectImagesThumbnails = useSelector(omeroSelectors.getImagesThumbnails(project?.omeroIds || []));
  const projectImagesDetails = useSelector(omeroSelectors.getImagesDetails(project?.omeroIds || []));
  const [activeImageIds, setActiveImageIds] = useState(block?.omeroIds || []);

  const currentTask = useSelector(tasksSelectors.getSelectedTask);
  const taskResults = useSelector(tasksSelectors.getTaskResults(currentTask));
  const [results, setResuls] = useState(res);

  const projectImagesOptions = useMemo(
    () => Object.entries(projectImagesThumbnails || {})
      .map(([id, img]) => {
        const { meta, size } = projectImagesDetails[id] || {};

        return ({
          id,
          img,
          title: `[${id}] ${meta?.imageName}`,
          description: `s: ${size?.width} x ${size?.height}, c: ${size?.c}`,
        });
      }),
    [projectImagesThumbnails, projectImagesDetails],
  );

  const projectFilesOptions = useMemo(
    () => (project?.file_names || []).map((fileName, index) => ({
      id: `file-${index}`,
      title: fileName,
      value: fileName,
    })),
    [project],
  );

  const projectImagesChannelsOptions = useMemo(() => {
    let selectedImgChannels = [];

    if (Object.keys(projectImagesDetails).length > 0 && activeImageIds.length > 0) {
      activeImageIds.forEach((im_id) => {
        if (projectImagesDetails.hasOwnProperty(im_id)) {
          selectedImgChannels = projectImagesDetails[im_id].channels;
        }
      });
    }

    return selectedImgChannels.map((el) => ({
      value: el.label,
      label: el.label,
      color: el.color,
      index: el.value,
    }));
  }, [projectImagesDetails, activeImageIds]);

  const status = block?.id === 'new' ? 'New' : statusFormatter(block.status);
  const header = `[${status}] ${block.description || block.name || ''}`;

  const fields = useMemo(
    () => (Object.entries(block.params_meta || {}).reduce((acc, [key, item]) => {
      if (item.hidden) {
        return acc;
      }

      const {
        name,
        label,
        description,
        type,
        required,
      } = item;

      const param = {
        name: `params.${key}`,
        label: label || name,
        placeholder: description,
        type,
        required,
      };
      return { ...acc, [name]: param };
    }, {})),
    [block.params_meta],
  );

  const initialValues = useMemo(
    () => ({
      ...block,
      id: block.id,
      name: block.name,
      projectId: block.projectId,
      pipelineId: block.pipelineId,
      rootId: block.rootId,
      file_names: block.file_names,
      params: {
        ...block.params,
        folder: block.folder,
        script: block.script,
        part: block.script_path,
      },
    }),
    [block],
  );

  useEffect(
    () => {
      if (!project?.omeroIds.length) {
        return;
      }

      dispatch(omeroActions.fetchImagesThumbnails(project?.omeroIds));
      dispatch(omeroActions.fetchImagesDetails(project?.omeroIds));
    },
    [dispatch, project?.omeroIds],
  );

  useEffect(
    () => {
      setActiveImageIds(block.omeroIds || []);
    },
    [block.omeroIds],
  );

  useEffect(
    () => {
      // eslint-disable-next-line react/prop-types
      if (!block?.tasks) {
        return;
      }

      // eslint-disable-next-line react-hooks/exhaustive-deps,react/prop-types
      block?.tasks.forEach(function (task) {
        if (task.id === currentTask) {
          setResuls(taskResults?.dataframe);
        } else
          setResuls(res);
      });
    },
    [block, results, currentTask, taskResults?.dataframe],
  );

  return (
    <Form
      {...tail}
      initialValues={initialValues}
      render={({ form, handleSubmit, submitting }) => {
        // const disabled = initialValues.id !== 'new';
        const disabled = false;
        if (onForm) {
          onForm(form);
        }
        return (
          <Container className={className}>
            <FormRenderer
              onSubmit={(event) => {
                // eslint-disable-next-line promise/catch-or-return,promise/prefer-await-to-then
                return handleSubmit(event)?.then(() => form.restart());
              }}
            >
              <Header>{header}</Header>

              <Body>
                {!block.params_meta?.omeroIds && activeImageIds[0] && (
                  <LeftPanel>
                    <ImageViewerContainer>
                      {projectImagesDetails[activeImageIds[0]] && (
                        <ImageViewer
                          data={projectImagesDetails[activeImageIds[0]]}
                          results={results}
                        />
                      )}
                      <ThumbnailsViewer
                        thumbnails={projectImagesOptions}
                        active={activeImageIds[0]}
                        onClick={setActiveImageIds}
                      />
                    </ImageViewerContainer>
                  </LeftPanel>
                )}

                <RightPanel>
                  {Object.keys(fields).length === 0 && (
                    <NoData>No block params to display</NoData>
                  )}
                  {Object.values(fields).map((field, i) => (
                    <Field
                      // eslint-disable-next-line react/no-array-index-key
                      key={`${i}-${field.name}`}
                      name={field.name}
                      label={field.label}
                      placeholder={field.placeholder}
                      component={getFieldComponent(field.type)}
                      parse={getFieldParser(field.type)}
                      validate={field.required ? Validators.required : undefined}
                      {...getFieldAdditionalProps(field.type, block, {
                        imagesOptions: projectImagesOptions,
                        imagesChannelsOptions: projectImagesChannelsOptions,
                        filesOptions: projectFilesOptions,
                      })}
                      disabled={disabled}
                    />
                  ))}
                </RightPanel>
              </Body>

              <Footer>
                <Button
                  color={ButtonColors.secondary}
                  onClick={(event) => {
                    form.restart();
                    onDownload(event);
                  }}
                  title="Download"
                >
                  <GetAppIcon />
                </Button>
                <div>
                  <Button
                    color={ButtonColors.secondary}
                    onClick={(event) => {
                      form.restart();
                      onRestart(event);
                    }}
                    title="Restart the block"
                  >
                    <Repeat />
                    Restart
                  </Button>
                  <Button
                    color={ButtonColors.secondary}
                    onClick={(event) => {
                      onReload(event);
                      form.restart();
                    }}
                    title="Refresh state of the block"
                  >
                    <Refresh />
                    refresh
                  </Button>
                  <Button
                    color={ButtonColors.secondary}
                    onClick={(event) => {
                      form.restart();
                      onClose(event);
                    }}
                  >
                    Close
                  </Button>
                  <Button
                    type="submit"
                    color={ButtonColors.primary}
                    disabled={submitting || disabled}
                  >
                    Submit
                  </Button>
                </div>
              </Footer>
            </FormRenderer>
          </Container>
        );
      }}
      mutators={{
        setValue: ([field, value], state, { changeValue }) => {
          changeValue(state, field, () => value);
        },
      }}
      decorators={[focusOnFirstFieldDecorator]}
      onSubmit={onSubmit}
    />
  );
};

const propTypes = {
  /**
   * Override or extend the styles applied to the component.
   */
  className: PropTypes.string,
  /**
   * Form fields.
   */
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.object, PropTypes.func]),
  /**
   * Initial values.
   */
  block: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    projectId: PropTypes.string,
    pipelineId: PropTypes.string,
    status: PropTypes.number,
    omeroIds: PropTypes.arrayOf(PropTypes.string),
    file_names: PropTypes.arrayOf(PropTypes.string),
    rootId: PropTypes.string,
    script_path: PropTypes.string,
    folder: PropTypes.string,
    script: PropTypes.string,
    params_meta: PropTypes.shape(),
    params: PropTypes.shape({}),
  }),
  /**
   * If true, the modal is open.
   */
  open: PropTypes.bool,
  /**
   * Modal props.
   */
  modalProps: PropTypes.shape({}),
  /**
   * Callback fired when the form is created.
   */
  onForm: PropTypes.func,
  /**
   * Callback fired when the component requests to be closed.
   */
  onClose: PropTypes.func,
  /**
   * A callback fired when confirm button clicked.
   */
  onSubmit: PropTypes.func,
  /**
   * A callback fired when restart button clicked.
   */
  onRestart: PropTypes.func,
  /**
   * A callback fired when refresh button clicked.
   */
  onReload: PropTypes.func,
  /**
   * A callback fired when load keys button clicked.
   */
  onDownload: PropTypes.func,
  /**
   * A callback fired when load keys button clicked.
   */
  onLoadKeys: PropTypes.func,
};

const defaultProps = {
  className: '',
  children: null,
  block: null,
  open: false,
  modalProps: null,
  onForm: () => {},
  onClose: () => {},
  onSubmit: () => {},
  onRestart: () => {},
  onReload: () => {},
  onDownload: () => {},
  onLoadKeys: () => {},
};

BlockSettingsForm.propTypes = propTypes;
BlockSettingsForm.defaultProps = defaultProps;

export {
  BlockSettingsForm as default,
  propTypes,
  defaultProps,
};

