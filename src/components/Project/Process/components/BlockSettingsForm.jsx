/* eslint-disable react/jsx-sort-default-props */
import React, { useState, useMemo, useEffect } from 'react';
import GetAppIcon from '@material-ui/icons/GetApp';
import Refresh from '@material-ui/icons/Refresh';
import createFocusOnFirstFieldDecorator from 'final-form-focus-on-first-field';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { actions as omeroActions, selectors as omeroSelectors } from '@/redux/modules/omero';
import { selectors as projectsSelectors } from '@/redux/modules/projects';
import { selectors as tasksSelectors } from '@/redux/modules/tasks';
import Button, { ButtonColors } from '+components/Button';
import Form, { Controls, Field, FormRenderer, Validators, Parsers } from '+components/Form';
import NoData from '+components/NoData';
import { statusFormatter } from '+utils/statusFormatter';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  width: 100%;
  height: 100%;
  overflow-y: auto;

  form {
    width: 100%;
      height: 100%;
  }
`;

const Header = styled.div`
  font-size: 1.5em;
  font-weight: bold;
  text-transform: capitalize;
  padding: 0 0 20px 0;

  :empty {
    display: none;
  }
`;

const RightPanel = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 20px;
  align-content: flex-start;
  height: 100%;

  :only-child {
    width: 100%;
  }
`;

const Footer = styled.div`
  align-self: end;
  position: fixed;
  bottom: 10px;
  
  .MuiButton-root + .MuiButton-root {
    margin-left: 15px;
    flex-shrink: 1;
  }
`;

const TextField = styled(Controls.TextField)`
  max-width: 300px;
`;

const NumberField = styled(Controls.NumberField)`
  max-width: 300px;
`;

const Select = styled(Controls.SelectNew)`
  width: 100%;
`;

const getFieldComponent = (type) => {
  switch (type) {
    case 'omero':
      return Controls.TransferList;
    case 'job_id':
      return Controls.SelectJobs;
    case 'process_job_id':
      return Controls.SelectJobsProcess;
    case 'file':
      return Controls.FilesTransferList;
    case 'channel':
    case 'channels':
      return Select;
    case 'int':
      return NumberField;
    case 'float':
      return Controls.NumberField;
    case 'string':
      return Controls.TextField;
    case 'enum':
      return Controls.SelectEnum;
    case 'dataGrid':
      return Controls.SelectGrid;
    default:
      return TextField;
  }
};

const getFieldParser = (type) => {
  switch (type) {
    case 'int':
      return Parsers.integer;
    case 'file':
      return Parsers.file;
    default:
      return undefined;
  }
};

const getFieldAdditionalProps = (type, block, { imagesOptions, imagesChannelsOptions, filesOptions, blockOptions }) => {
  switch (type) {
    case 'omero':
      return { options: imagesOptions };
    case 'channels':
      return { options: imagesChannelsOptions };
    case 'channel':
      return {
        onlyOneValue: true,
        options: imagesChannelsOptions,
      };
    case 'file':
      const formattedFileNames = (block.file_names || []).map((fileName) => {
        const foundOption = filesOptions.find((option) => option.value === fileName);
        return foundOption ? foundOption : { id: `file-${Math.random()}`, title: fileName, value: fileName };
      });

      return {
        options: filesOptions,
        file_names:  formattedFileNames,
      };
    case 'int':
      return {
        options: imagesChannelsOptions,
      };
    case 'enum':
      return {
        options: blockOptions,
        value: '123',
      };
    case 'dataGrid':
      return {};
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
  // eslint-disable-next-line no-unused-vars
  const [activeImageIds, setActiveImageIds] = useState(block?.omeroIds || []);

  const currentTask = useSelector(tasksSelectors.getSelectedTask);
  const taskResults = useSelector(tasksSelectors.getTaskResults(currentTask));
  const tasksChannels = useSelector(tasksSelectors.getTaskClusterChannels(block?.rootId || []));
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
    [project?.file_names],
  );

  const projectImagesChannelsOptions = useMemo(() => {
    let allImgChannels = [];

    if (Object.keys(projectImagesDetails).length > 0) {
      Object.keys(projectImagesDetails).forEach((im_id) => {
        if (projectImagesDetails.hasOwnProperty(im_id)) {
          allImgChannels = [...allImgChannels, ...projectImagesDetails[im_id].channels];
        }
      });
    }

    const uniqueImgChannels = Array.from(new Set(allImgChannels.map((a) => a.label)))
      .map((label) => {
        return allImgChannels.find((a) => a.label === label);
      });

    if (tasksChannels !== undefined && tasksChannels.length > 0) {
      const filteredImgChannels = uniqueImgChannels.filter((imgChannel) => {
        const sanitizedImgChannelLabel = imgChannel.label.replace(/[^0-9a-zA-Z]/g, '').toLowerCase().replace('target', '');

        return tasksChannels.some((taskChannel) => taskChannel?.toLowerCase() === sanitizedImgChannelLabel);
      });

      return filteredImgChannels.map((el) => ({
        value: el.label,
        label: el.label,
        color: el.color,
        index: el.value,
      }));
    }

    return uniqueImgChannels.map((el) => ({
      value: el.label,
      label: el.label,
      color: el.color,
      index: el.value,
    }));
  }, [projectImagesDetails, tasksChannels]);


  const projectBlockOptions = useMemo(() => {
    const enumOptionsByLabel = {};

    if (block && block.params_meta) {
      Object.entries(block.params_meta).forEach(([key, { type, enum: enumOptions }]) => {
        if (type === 'enum') {
          enumOptionsByLabel[key] = enumOptions.map((option) => ({
            value: option,
            label: option,
            index: option,
          }));
        }
      });
    }

    return enumOptionsByLabel;
  }, [block]);

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
        enum: item.enum,
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
      processId: block.processId,
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
      block?.tasks.forEach((task) => {
        if (task.id === currentTask) {
          setResuls(taskResults?.dataframe);
        } else
          setResuls(res);
      });
    },
    [block, results, currentTask, taskResults?.dataframe],
  );

  const memoizedDecorator = useMemo(() => [focusOnFirstFieldDecorator], []);

  return (
    <Form
      {...tail}
      initialValues={initialValues}
      render={({ form, handleSubmit, submitting }) => {
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

              <RightPanel >
                {Object.keys(fields).length === 0 && (
                  <NoData style={{ height: '100px' }}>No block params to display</NoData>
                  )}

                {Object.values(fields).map((field, i) => (
                  <Field
                      // eslint-disable-next-line react/no-array-index-key
                    key={`${i}-${field.name}`}
                    id={`${i}-${field.name}`}
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
                        blockOptions: projectBlockOptions[field.label],
                      })}
                    disabled={disabled}
                  />
                  ))}
              </RightPanel>

              <Footer>
                {(block?.id === 'new') ?
                  <Button
                    type="submit"
                    color={ButtonColors.secondary}
                    onClick={onClose}
                  >
                    CANCEL
                  </Button>
                    : (
                      <React.Fragment>
                        <Button
                          color={ButtonColors.secondary}
                          onClick={(event) => {
                                onDownload(event);
                          }}
                          title="Download"
                        >
                          <GetAppIcon />
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
                      </React.Fragment>
                    )}
                <Button
                  type="submit"
                  color={ButtonColors.primary}
                  disabled={submitting || disabled}
                >
                  Save
                </Button>
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
      decorators={memoizedDecorator}
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
    processId: PropTypes.string,
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

