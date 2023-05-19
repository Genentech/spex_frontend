import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import DynamicFeedOutlinedIcon from '@material-ui/icons/DynamicFeedOutlined';
import ErrorIcon from '@material-ui/icons/Error';

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import GetAppIcon from '@material-ui/icons/GetApp';
import WallpaperIcon from '@material-ui/icons/Wallpaper';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import classNames from 'classnames';
import dagre from 'dagre';
import cloneDeep from 'lodash/cloneDeep';
import ReactFlow, { ReactFlowProvider, Controls, Background, isNode, ControlButton } from 'react-flow-renderer';
import { useDispatch, useSelector } from 'react-redux';
import { matchPath, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import PathNames from '@/models/PathNames';
import { actions as jobsActions, selectors as jobsSelectors } from '@/redux/modules/jobs';
import { actions as omeroActions, selectors as omeroSelectors } from '@/redux/modules/omero';
import { actions as pipelineActions, selectors as pipelineSelectors } from '@/redux/modules/pipelines';
import { selectors as projectsSelectors } from '@/redux/modules/projects';
import { actions as tasksActions, selectors as tasksSelectors } from '@/redux/modules/tasks';

import Button from '+components/Button';
import ConfirmModal, { ConfirmActions } from '+components/ConfirmModal';
import Form, { Field, Controls as ControlsForm } from '+components/Form';
import { ScrollBarMixin } from '+components/ScrollBar';
import { Box } from '+components/Tabs';
import statusFormatter from '+utils/statusFormatter';

import JobBlock from './blocks/JobBlock';
import StartBlock from './blocks/StartBlock';
import AddBlockForm from './components/AddBlockForm';
// import BlockSettingsForm from './components/BlockSettingsForm';
import BlockSettingsFormWrapper from './components/BlockSettingsFormWrapper';
import Container from './components/Container';
import FlowWrapper from './components/FlowWrapper';
import OutputWrapper from './components/OutputWrapper';
import ImageViewer from '+components/ImageViewer';
import ThumbnailsViewer from '+components/ThumbnailsViewer';

const jobRefreshInterval = 6e4; // 1 minute

const flowDirection = 'TB';
const nodeWidth = 172;
const nodeHeight = 36;

const nodeTypes = {
  start: StartBlock,
  job: JobBlock,
};

const ResultValue = styled.div`
  overflow-x: auto;
  width: 500px;
  margin-left: 1em;
  
  ${ScrollBarMixin}
`;

const ImageViewerContainer = styled.div`
  flex-grow: 1;
  flex-shrink: 1;
  height: 100%;
`;


const addNewVirtualJobToPipeline = (rootId, newJob, node) => {
  if (node.id === rootId) {
    if (!node.jobs) {
      node.jobs = [];
    }
    node.jobs.push(newJob);
  } else {
    for (let i = 0; i < (node.jobs || []).length; i++) {
      // eslint-disable-next-line no-unused-vars
      addNewVirtualJobToPipeline(rootId, newJob, node.jobs[i]);
    }
  }
};

const createElements = (inputData, result, options = {}, selectedBlock) => {
  const { jobs } = inputData;

  if (!jobs) {
    return result;
  }

  jobs.forEach((job) => {
    if (!job.id) {
      return;
    }

    result.push({
      id: job.id,
      type: 'job',
      position: options.position,
      className: classNames({
        new: job.id === 'new',
        selected: job.id === selectedBlock?.id,
      }),
      data: {
        ...job,
        ...options.data,
      },
    });

    result.push({
      id: `${inputData.id}-${job.id}`,
      type: 'smoothstep',
      source: inputData.id,
      target: job.id,
      animated: job.status !== 1,
    });

    result = createElements(job, result, options, selectedBlock);
  });

  return result;
};

const createGraphLayout = (elements, direction = 'LR') => {
  const graph = new dagre.graphlib.Graph();

  graph.setGraph({ rankdir: direction });
  graph.setDefaultEdgeLabel(() => ({}));

  elements.forEach((el) => {
    if (isNode(el)) {
      graph.setNode(el.id, { width: nodeWidth, height: nodeHeight });
    } else {
      graph.setEdge(el.source, el.target);
    }
  });

  dagre.layout(graph);

  const isHorizontal = direction === 'LR';

  return elements.map((el) => {
    if (isNode(el)) {
      const nodeWithPosition = graph.node(el.id);
      el.targetPosition = isHorizontal ? 'left' : 'top';
      el.sourcePosition = isHorizontal ? 'right' : 'bottom';
      el.position = {
        x: nodeWithPosition.x - nodeWidth / 2 + Math.random() / 1000,
        y: nodeWithPosition.y - nodeHeight / 2,
      };
    }
    return el;
  });
};


const sortTaskById = ({ id: a }, { id: b }) => {
  return +a - +b;
};

const Process = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const matchProjectPath = matchPath(location.pathname, { path: `/${PathNames.projects}/:id` });
  const projectId = matchProjectPath ? matchProjectPath.params.id : undefined;
  const project = useSelector(projectsSelectors.getProject(projectId));

  const [activeImageIds, setActiveImageIds] = useState(project?.omeroIds || []);
  const [selectedChannelsByTask, setSelectedChannelsByTask] = useState({});
  const projectImagesDetails = useSelector(omeroSelectors.getImagesDetails(project?.omeroIds || []));

  const matchProcessPath = matchPath(location.pathname, {
    path: `/${PathNames.projects}/${projectId}/${PathNames.processes}/:id`,
  });
  const processId = matchProcessPath ? matchProcessPath.params.id : undefined;
  const pipeline = useSelector(pipelineSelectors.getPipeline(projectId, processId));
  const jobs = useSelector(jobsSelectors.getJobsByPipelineId(processId));
  const tasks = useSelector(tasksSelectors.getTasks);
  const results = useSelector(tasksSelectors.getResults);
  const jobTypes = useSelector(jobsSelectors.getJobTypes);

  const [refresher, setRefresher] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [actionWithBlock, setActionWithBlock] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [currImages, setCurrImages] = useState({});
  const images_visualization = useSelector(tasksSelectors.getTaskVisualizations || {});

  const elements = useMemo(
    () => {
      let _elements = [];

      if (!pipeline) {
        return _elements;
      }

      const options = {
        position: { x: 0, y: 0 },
        data: {
          direction: flowDirection,
          onAdd: () => setActionWithBlock('add'),
          onDelete: () => setActionWithBlock('delete'),
        },
      };

      _elements.push({
        id: pipeline.id,
        type: 'start',
        position: options.position,
        className: classNames({ selected: pipeline.id === selectedBlock?.id }),
        data: {
          ...options.data,
          id: pipeline.id,
          value: 'pipeline',
          status: '0',
        },
      });

      const pipelineClone = cloneDeep(pipeline);

      if (selectedBlock && selectedBlock.rootId && selectedBlock.id === 'new') {
        addNewVirtualJobToPipeline(selectedBlock.rootId, selectedBlock, pipelineClone);
      }

      _elements = createElements(pipelineClone, _elements, options, selectedBlock);
      return createGraphLayout(_elements, flowDirection);
    },
    [pipeline, selectedBlock],
  );

  const projectImagesChannelsOptions = useMemo(
    () => {
      let selectedImgChannels = [];
      if (Object.keys(projectImagesDetails).length > 0 && activeImageIds.length > 0) {
        activeImageIds.forEach((im_id) => {
          selectedImgChannels = projectImagesDetails[im_id].channels;
        });
      }

      return selectedImgChannels.map((el) => ({
        value: el.label,
        label: el.label,
        color: el.color,
        index: el.value,
      }));
    },
    [projectImagesDetails, activeImageIds],
  );


  const onJobCancel = useCallback(
    () => {
      setActionWithBlock(null);
      setSelectedBlock(null);
    },
    [],
  );

  const nameReturnKey = useMemo(
    () => {
      if (Object.keys(jobTypes).length === 0) {
        return {};
      }
      let returnValues = {};
      Object.keys(jobTypes).forEach((jobType) => {
        jobTypes[jobType]['stages'].forEach((stage) => {
          stage['scripts'].forEach((script) => {
            returnValues[script['name']] = Object.keys(script['return'])[0];
          });
        });
      });
      return returnValues;
    },
    [jobTypes],
  );

  const onLoadVisualize = useCallback(
    () => {
      selectedBlock.tasks.forEach((item) => {
        const channels = selectedChannelsByTask[item.id];
        dispatch(tasksActions.fetchTaskVisualize({
          id: item.id,
          name: item.name,
          key: nameReturnKey[item.name],
          script: selectedBlock.script,
          channels,
        }));
      });
    },
    [dispatch, selectedBlock, nameReturnKey, selectedChannelsByTask],
  );

  useEffect(
    () => {
      if (!project?.omeroIds.length) {
        return;
      }

      dispatch(omeroActions.fetchImagesDetails(project?.omeroIds));
    },
    [dispatch, project?.omeroIds],
  );

  useEffect(
    () => {
      setActiveImageIds(project?.omeroIds || []);
    },
    [project?.omeroIds],
  );

  useEffect(
    () => {
      let imgToShow = {};
      if (!selectedBlock || !selectedBlock.tasks || Object.keys(images_visualization).length === 0) {
        return;
      }
      const taskIds = selectedBlock.tasks.map((item) => {return item.id;});
      Object.keys(images_visualization).forEach((task_id) => {
        if (taskIds.includes(task_id)) {
          imgToShow[task_id] = images_visualization[task_id];
        }
      });
      setCurrImages(imgToShow);
    },
    [images_visualization, selectedBlock, setCurrImages],
  );

  const onJobSubmit = useCallback(
    (values) => {
      setActionWithBlock(null);
      setSelectedBlock(null);

      const validOmeroIds = values.params?.omeroIds
        ? values.params.omeroIds.filter((id) => project.omeroIds.includes(id))
        : jobs[values.rootId]?.omeroIds;

      const { filename, ...params } = values.params;
      const file_names = filename ? [filename] : [];

      const normalizedValues = {
        ...values,
        params: { ...params },
        omeroIds: validOmeroIds,
        file_names: file_names,
      };

      if (normalizedValues.id === 'new') {
        delete normalizedValues.id;
      }

      if (normalizedValues.id) {
        const currentJob = jobs[normalizedValues.id];

        const sortedCurrentOmeroIds = [...currentJob.omeroIds].sort();
        const sortedValidOmeroIds = [...validOmeroIds].sort();

        if (
          JSON.stringify(sortedCurrentOmeroIds) !==
          JSON.stringify(sortedValidOmeroIds)
        ) {
          normalizedValues.status = -2;
        }

        dispatch(pipelineActions.updateJob(normalizedValues));
        return;
      }

      const [rootId] = normalizedValues.params?.job || [];
      if (rootId != null) {
        dispatch(pipelineActions.createConn(normalizedValues));
        normalizedValues.rootId = rootId;
      }

      dispatch(pipelineActions.createJob(normalizedValues));
    },
    [dispatch, jobs, project],
  );

  const onStartPipeline = useCallback(
    () => {
      dispatch(jobsActions.startPipeline(processId));
    },
    [dispatch, processId],
  );

  const onJobRestart = useCallback(
    (_) => {
      const job = {
        id: jobs[selectedBlock?.id].id,
        status: 0,
        tasks: jobs[selectedBlock?.id].tasks,
      };


      if (job.id) {
        job.tasks.forEach((el) => {
          const task = {
            id: el.id, status: 0, result: '',
          };

          dispatch(tasksActions.updateTask(task));
        });
        delete job.tasks;
        dispatch(jobsActions.updateJob(job));
      }
    },
    [dispatch, jobs, selectedBlock],
  );

  const onPaneClick = useCallback(
    () => {
      setActionWithBlock(null);
      setSelectedBlock(null);
    },
    [],
  );

  const onBlockClick = useCallback(
    async (_, block) => {
      if (block.id === 'new') {
        return;
      }
      await dispatch(jobsActions.fetchJobsByPipelineId(processId));

      const job = jobs[block.id];
      if (!job) {
        setSelectedBlock({
          projectId,
          processId,
          ...block,
        });
        return;
      }

      const jobTasks = [...(job.tasks || [])].sort(sortTaskById);

      const [{ params }] = jobTasks;
      const jobTypeBlocks = (jobTypes[params.script]?.stages || [])
        .reduce((acc, stage) => [
          ...acc,
          ...stage.scripts,
        ], []);

      const jobType = jobTypeBlocks.find((el) => el.script_path === params.part) || {};

      const errors = jobTasks
        .map((task) => task.error && ({ id: task.id, error: task.error }))
        .filter(Boolean);

      setSelectedBlock({
        ...jobType,
        projectId,
        processId,
        errors,
        id: job.id,
        name: job.name,
        status: job.status,
        file_names: job.file_names,
        omeroIds: job.omeroIds,
        folder: params.folder,
        script: params.script,
        script_path: params.part,
        params,
        tasks: jobTasks,
      });
    },
    [jobTypes, jobs, processId, projectId, dispatch],
  );

  const onJobReload = useCallback(
    (_) => {
      if (selectedBlock.id === 'new') {
        return;
      }

      if (selectedBlock.id) {
        dispatch(jobsActions.fetchJob(selectedBlock.id));
        onBlockClick(_, selectedBlock);
      }
    },
    [dispatch, selectedBlock, onBlockClick],
  );

  const onDownload = useCallback(
    async (_, block) => {
      if (block.id === 'new') {
        return;
      }

      const job = jobs[block.id];
      if (!job) {
        return;
      }

      // Customize the file name based on your requirements
      const fileName = `job_${job.id}.zip`;

      dispatch(jobsActions.downloadJob({ jobId: job.id, fileName }));
    },
    [jobs, dispatch],
  );

  const onJobDownload = useCallback(
    (_) => {
      if (selectedBlock.id === 'new') {
        return;
      }

      if (selectedBlock.id) {
        onDownload(_, selectedBlock);
      }
    },
    [selectedBlock, onDownload],
  );

  const onBlockAdd = useCallback(
    (block) => {
      setActionWithBlock(null);

      setSelectedBlock((prevValue) => ({
        projectId,
        processId,
        rootId: prevValue?.id,
        id: 'new',
        status: 0,
        omeroIds: jobs[prevValue?.id]?.omeroIds,
        ...block,
      }));
    },
    [jobs, processId, projectId],
  );

  const onBlockDelete = useCallback(
    () => {
      dispatch(pipelineActions.deleteJob({
        projectId,
        processId,
        jobId: selectedBlock.id,
      }));

      setActionWithBlock(null);
      setSelectedBlock(null);
    },
    [dispatch, processId, projectId, selectedBlock],
  );

  const onLoad = useCallback(
    (instance) => {
      setReactFlowInstance(instance);
    },
    [setReactFlowInstance],
  );

  const onLoadValue = useCallback(
    (event) => {
      const key = event.currentTarget.dataset.key;
      const id = event.currentTarget.dataset.taskId;

      if (id == null || !key) {
        return;
      }

      dispatch(tasksActions.fetchTaskResult({ id, key: key }));
    },
    [dispatch],
  );

    const tasksRender = useMemo(
    () => {
      if (!selectedBlock?.tasks?.length) {
        return null;
      }

      const returnKeys = Object.keys(selectedBlock.return || {});

      const resultKeys = selectedBlock.tasks.reduce((acc, { id }) => {
        const keys = tasks[id]?.keys || [];
        if (!keys.length) {
          return acc;
        }

        const result = returnKeys.filter((key) => keys.includes(key));

        if (result.length) {
          acc[id] = result.map((key) => ({ key, value: results?.[id]?.[key] }));
        }

        return acc;
      }, {});
      const onSubmit = (values) => {
      };


      return (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <DynamicFeedOutlinedIcon /> Tasks
          </AccordionSummary>
          <AccordionDetails>
            <List dense component="div">
              <Grid container>
                {selectedBlock.tasks.map((item) => (
                  <Grid item xs={12} key={item.id}>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        Task ID: {item.id}
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid item xs={12}>
                          <List dense component="div">
                            <ListItemText
                              secondary={`[${statusFormatter(item.status)}] ${item.name}`}
                            />
                            <ListItem component="div">
                              Results for channels
                            </ListItem>
                            <ListItem component="div" key={`channels-${item.id}`}>
                              <Form
                                onSubmit={onSubmit}
                                render={({ handleSubmit }) => (
                                  <form onSubmit={handleSubmit}>
                                    <div style={{ overflow: 'auto', maxHeight: '300px' }}>
                                      <Field
                                        name={`channels-${item.id}`}
                                        component={ControlsForm.SelectNew}
                                        type="channels"
                                        options={projectImagesChannelsOptions}
                                        onSelectedChannelsChange={(val) => {
                                          setSelectedChannelsByTask((prevState) => ({ ...prevState, [item.id]: val }));
                                        }}
                                      />
                                    </div>
                                  </form>
                                )}
                              />
                            </ListItem>
                            {!resultKeys[item.id] ? (
                              <ListItem component="div">
                                No Data
                              </ListItem>
                            ) : resultKeys[item.id].map(({ key, value }) => (
                              <ListItem component="div" key={key}>
                                <ListItemText
                                  primary={(
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={onLoadVisualize}
                                      data-key={key}
                                      data-task-id={item.id}
                                      startIcon={<WallpaperIcon />}
                                    >
                                      Render value
                                    </Button>
                                  )}
                                  secondary={(
                                    <Button
                                      onClick={onLoadValue}
                                      size="small"
                                      variant="outlined"
                                      startIcon={<GetAppIcon />}
                                      data-key={key}
                                      data-task-id={item.id}
                                    >
                                      Download value
                                    </Button>
                                  )}
                                />
                                {value != null && (
                                  <ResultValue>
                                    <pre>
                                      {value || ''}
                                    </pre>
                                  </ResultValue>
                                )}
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                        <Grid item xs={12}>
                          <ImageList cols={1}>
                            {Object.keys(Object(currImages[item.id])).map((key) => (
                              <ImageListItem key={`${item.id}-${key}-${item.id}`}>
                                <p>
                                  <Box
                                    key={`${item.id}-${key}-${item.id}`}
                                    component="img"
                                    src={currImages[item.id][key]}
                                    alt={key}
                                  />
                                </p>
                              </ImageListItem>
                            ))}
                          </ImageList>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                ))}
              </Grid>
            </List>
          </AccordionDetails>
        </Accordion>
      );
    },
    [onLoadValue, selectedBlock, tasks, results, onLoadVisualize, currImages, projectImagesChannelsOptions],
  );

  useEffect(
    () => {
      if (pipeline || !projectId || !processId) {
        return;
      }
      dispatch(pipelineActions.fetchPipeline({ projectId, processId }));
    },
    [dispatch, pipeline, projectId, processId],
  );

  useEffect(() => {
    if (actionWithBlock === 'restart' && selectedBlock?.id) {
      onJobRestart('');
      setActionWithBlock(null);
    }
  }, [actionWithBlock, selectedBlock, onJobRestart]);

    useEffect(
    () => {
      if (!selectedBlock || !jobs?.[selectedBlock.id]) {
        return;
      }

      if (selectedBlock.status !== jobs[selectedBlock.id].status) {
        const job = jobs[selectedBlock.id];
        const jobTasks = [...(job.tasks || [])].sort(sortTaskById);

        const [{ params }] = jobTasks;
        const jobTypeBlocks = (jobTypes[params.script]?.stages || [])
          .reduce((acc, stage) => [
            ...acc,
            ...stage.scripts,
          ], []);

        const { description, params_meta } = jobTypeBlocks.find((el) => el.script_path === params.part) || {};
        setSelectedBlock({
          projectId,
          processId,
          id: job.id,
          name: job.name,
          status: job.status,
          omeroIds: job.omeroIds,
          file_names: job.file_names,
          description,
          folder: params.folder,
          script: params.script,
          script_path: params.part,
          params,
          params_meta,
          tasks: jobTasks,
        });
      }
    },
    [selectedBlock, jobs, projectId, processId, jobTypes],
  );

  useEffect(
    () => {
      if (!selectedBlock || !jobs?.[selectedBlock.id]) {
        return;
      }

      const job = jobs[selectedBlock.id];

      job.tasks.forEach(({ id }) => {
        dispatch(tasksActions.fetchTaskKeys(id));
      });
    },
    [dispatch, jobs, selectedBlock],
  );

  useEffect(
    () => {
      dispatch(jobsActions.fetchJobsByPipelineId(processId));
      return () => {
        dispatch(jobsActions.clearJobs());
      };
    },
    [dispatch, refresher, processId],
  );

  useEffect(
    () => {
      const jobIntervalId = setInterval(() => {
        setRefresher(Date.now());
      }, jobRefreshInterval);

      return () => {
        if (jobIntervalId) {
          clearInterval(jobIntervalId);
        }
      };
    },
    [],
  );

  useEffect(
    () => {
      if (!(elements && reactFlowInstance)) {
        return;
      }

      const reactFlowTimeoutId = setTimeout(() => {
        reactFlowInstance.fitView();
      }, 100);

      return () => {
        if (reactFlowTimeoutId) {
          clearTimeout(reactFlowTimeoutId);
        }
      };
    },
    [elements, reactFlowInstance],
  );

  useEffect(
    () => {
      dispatch(jobsActions.fetchJobTypes());
      dispatch(tasksActions.fetchTasks());
      return () => {
        dispatch(jobsActions.clearJobTypes());
        dispatch(tasksActions.clearTasks());
      };
    },
    [dispatch],
  );

  return (
    <ReactFlowProvider>
      <Grid
        container
        spacing={2}
        direction='row'
      >
        <Grid
          item
          container
          direction='row'
          xs='4'
        >
          <Grid
            item
            container
            direction='column'
            xs='12'
            style={{ height: '30%' }}
          >
            <FlowWrapper>
              <ReactFlow
                nodeTypes={nodeTypes}
                elements={elements}
                onElementClick={onBlockClick}
                onPaneClick={onPaneClick}
                onLoad={onLoad}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                snapToGrid
              >
                <Controls showInteractive={false}>
                  <ControlButton
                    style={{
                    backgroundColor: 'green',
                    color: 'white',
                    whiteSpace: 'nowrap',
                    zIndex: 99, width: '80% ',
                    }}
                    onClick={onStartPipeline}
                  > Start ▶
                  </ControlButton>
                </Controls>

                <Background />
              </ReactFlow>
            </FlowWrapper>
          </Grid>
          <Grid
            item
            container
            direction='column'
            xs='12'
            style={{ height: '10%' }}
          >
            <Typography variant="body2" gutterBottom>
              Section 1
            </Typography>
          </Grid>
          <Grid
            item
            container
            direction='column'
            xs='12'
            style={{ height: '50%' }}
          >
            <Typography variant="body2" gutterBottom>
              Section 2
            </Typography>
          </Grid>
        </Grid>
        <Grid item xs={8}>
          <Container>
            <ImageViewer
              editable={false}
            />
          </Container>
        </Grid>
      </Grid>

      {actionWithBlock === 'add' && selectedBlock?.id && (
        <AddBlockForm
          header="Add Block"
          jobTypes={jobTypes}
          selectedBlock={selectedBlock}
          onClose={() => setActionWithBlock(null)}
          onSubmit={onBlockAdd}
          open
        />
      )}

      {actionWithBlock === 'delete' && selectedBlock?.id && (
        <ConfirmModal
          action={ConfirmActions.delete}
          item={selectedBlock.name}
          onClose={() => setActionWithBlock(null)}
          onSubmit={onBlockDelete}
          open
        />
      )}
    </ReactFlowProvider>
  );
};

export default Process;
