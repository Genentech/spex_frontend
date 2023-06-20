import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Grid from '@material-ui/core/Grid';
import classNames from 'classnames';
import dagre from 'dagre';
import cloneDeep from 'lodash/cloneDeep';
import PropTypes from 'prop-types';
import ReactFlow, { ReactFlowProvider, Controls, Background, isNode } from 'react-flow-renderer';
import { useDispatch, useSelector } from 'react-redux';
import { matchPath, useLocation } from 'react-router-dom';
import SplitPane from 'react-split-pane';
import styled from 'styled-components';

import PathNames from '@/models/PathNames';
import { actions as jobsActions, selectors as jobsSelectors } from '@/redux/modules/jobs';
import { actions as omeroActions, selectors as omeroSelectors } from '@/redux/modules/omero';
import { actions as pipelineActions, selectors as pipelineSelectors } from '@/redux/modules/pipelines';
import { selectors as projectsSelectors } from '@/redux/modules/projects';
import { actions as tasksActions, selectors as tasksSelectors } from '@/redux/modules/tasks';

import BlocksScroll from '+components/BlocksScroll';
import ConfirmModal, { ConfirmActions } from '+components/ConfirmModal';
import ImageViewer from '+components/ImageViewer';
import NoData from '+components/NoData';
import ThumbnailsViewer from '+components/ThumbnailsViewer';

import JobBlock from './blocks/JobBlock';
import BlockScrollWrapper from './components/BlockScrollWrapper';
import BlockSettingsForm from './components/BlockSettingsForm';
import BlockSettingsFormWrapper from './components/BlockSettingsFormWrapper';
import Container from './components/Container';
import FlowWrapper from './components/FlowWrapper';


const jobRefreshInterval = 6e4; // 1 minute

const flowDirection = 'LR';
const nodeWidth = 172;
const nodeHeight = 36;

const nodeTypes = {
  job: JobBlock,
};


const ImageViewerContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #ccc;
  border-radius: 4px;
  //overflow: hidden;
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

const Process = ( { sidebarWidth } ) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const matchProjectPath = matchPath(location.pathname, { path: `/${PathNames.projects}/:id` });
  const projectId = matchProjectPath ? matchProjectPath.params.id : undefined;
  const project = useSelector(projectsSelectors.getProject(projectId));
  const projectImagesDetails = useSelector(omeroSelectors.getImagesDetails(project?.omeroIds || []));
  const [activeImageIds, setActiveImageIds] = useState(project?.omeroIds || []);
  // eslint-disable-next-line no-unused-vars
  const [activeBlock, setActiveBlock] = useState([]);
  const [sizes, setSizes] = useState([
    300,
    400,
    'auto',
  ]);

  const matchProcessPath = matchPath(location.pathname, {
    path: `/${PathNames.projects}/${projectId}/${PathNames.processes}/:id`,
  });
  const pipelineId = matchProcessPath ? matchProcessPath.params.id : undefined;
  const pipeline = useSelector(pipelineSelectors.getPipeline(projectId, pipelineId));
  const jobs = useSelector(jobsSelectors.getJobsByPipelineId(pipelineId));
  const projectImagesThumbnails = useSelector(omeroSelectors.getImagesThumbnails(project?.omeroIds || []));
  const jobTypes = useSelector(jobsSelectors.getJobTypes);

  const [refresher, setRefresher] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [actionWithBlock, setActionWithBlock] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [currImages, setCurrImages] = useState({});
  const [availableBlocks, setAvailableBlocks] = useState({});
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

      const pipelineClone = cloneDeep(pipeline);

      if (selectedBlock && selectedBlock.rootId && selectedBlock.id === 'new') {
        // addNewVirtualJobToPipeline(selectedBlock.rootId, selectedBlock, pipelineClone);
      }

      _elements = createElements(pipelineClone, _elements, options, selectedBlock);
      return createGraphLayout(_elements, flowDirection);
    },
    [pipeline, selectedBlock],
  );

  const initialBlocks = useMemo(() => {
    let blocks = [];
    Object.keys(jobTypes).forEach((jobType) => {
      jobTypes[jobType]['stages'].forEach((stage) => {
        stage['scripts'].forEach((block) => {
          if ((block.depends_and_script === undefined || block.depends_and_script.length === 0) &&
            (block.depends_or_script === undefined || block.depends_or_script.length === 0)) {
            blocks.push({ ...block, folder: jobType, script: jobType });
          }
        });
      });
    });
    return blocks;
  }, [jobTypes]);

  const projectImagesOptions = useMemo(
    () => Object.entries(projectImagesThumbnails || {})
      .filter(([id]) => !selectedBlock?.omeroIds || selectedBlock.omeroIds.includes(id))
      .map(([id, img]) => {
        const { meta, size } = projectImagesDetails[id] || {};

        return ({
          id,
          img,
          title: `[${id}] ${meta?.imageName}`,
          description: `s: ${size?.width} x ${size?.height}, c: ${size?.c}`,
        });
      }),
    [projectImagesThumbnails, projectImagesDetails, selectedBlock],
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
      if (selectedBlock?.omeroIds) {
        setActiveImageIds(selectedBlock?.omeroIds);
      } else {
        setActiveImageIds(project?.omeroIds || []);
      }
    },
    [project?.omeroIds, selectedBlock],
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

  useEffect(
    () => {
      if (!selectedBlock || Object.keys(jobTypes).length === 0) {
        return;
      }
      if ( availableBlocks[selectedBlock.script_path] === undefined) {
        let blocks = [];
        Object.keys(jobTypes).forEach((jobType) => {
          jobTypes[jobType]['stages'].forEach((stage) => {
              stage['scripts'].forEach((block) => {
                const enabled = block.depends_and_script?.includes(selectedBlock.script_path)
                   || block.depends_or_script?.includes(selectedBlock.script_path);
                if (enabled) {
                  blocks.push({ ...block, folder: jobType, script: jobType });
                }
              });
          });
        });
        setAvailableBlocks({ ...availableBlocks, [selectedBlock.name]: blocks });
      }
    },
    [selectedBlock, availableBlocks, jobTypes, initialBlocks],
  );

  const selectedImagesDetails = useMemo(() => {
    if (selectedBlock?.omeroIds) {
      return selectedBlock.omeroIds.reduce((details, id) => {
        if (projectImagesDetails[id]) {
          details[id] = projectImagesDetails[id];
        }
        return details;
      }, {});
    }
    return projectImagesDetails;
  }, [selectedBlock, projectImagesDetails]);


  useEffect(
    () => {
      if (availableBlocks['initial'] === undefined && initialBlocks.length > 0) {
        setAvailableBlocks({ ...availableBlocks, 'initial': initialBlocks });
      }
    },
    [availableBlocks, initialBlocks],
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

  function isArrayOfObjects(value) {
    if (!Array.isArray(value)) {
      return false;
    }

    return value.every((item) => typeof item === 'object' && item !== null);
  }

  const onJobSubmit = useCallback(
    (values) => {
      setActionWithBlock(null);
      setSelectedBlock(null);

      let validOmeroIds = jobs[values.rootId]?.omeroIds || [];

      if (isArrayOfObjects(values.params?.omeroIds)) {
        validOmeroIds = values.params?.omeroIds.map((item) => item.id);
      } else if (values.params?.omeroIds && typeof values.params?.omeroIds === 'string') {
        validOmeroIds = values.params?.omeroIds.replace(' ','').split(',');
      }

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
      dispatch(jobsActions.fetchJobsByPipelineId(pipelineId));
    },
    [dispatch, jobs, pipelineId],
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
      await dispatch(jobsActions.fetchJobsByPipelineId(pipelineId));

      const job = jobs[block.id];
      if (!job) {
        const par = block.data.params;
        setSelectedBlock({
          projectId,
          pipelineId: pipelineId,
          omeroIds: block.omeroIds,
          ...block.data,
          folder: par.folder,
          script: par.script,
          script_path: par.part,
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
        pipelineId: pipelineId,
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
    [jobTypes, jobs, pipelineId, projectId, dispatch],
  );

  const onBlockDelete = useCallback(
    () => {
      dispatch(pipelineActions.deleteJob({
        projectId,
        pipelineId,
        jobId: selectedBlock.id,
      }));

      setActionWithBlock(null);
      setSelectedBlock(null);
    },
    [dispatch, pipelineId, projectId, selectedBlock],
  );

  const onLoad = useCallback(
    (instance) => {
      setReactFlowInstance(instance);
    },
    [setReactFlowInstance],
  );

  const onJobCancel = useCallback(
    () => {
      setActionWithBlock(null);
      setSelectedBlock(null);
    },
    [],
  );

  const handleBlockClick = (newActive) => {
    if (newActive.length === 1) {
      setSelectedBlock((prevValue) => {
        if (prevValue === null) {
          setAvailableBlocks( { });
          return {
            projectId,
            pipelineId: pipelineId,
            rootId: undefined,
            id: 'new',
            status: 0,
            omeroIds: jobs[prevValue?.id]?.omeroIds,
            ...newActive[0],
          };
        }
        if (prevValue.id !== 'new') {
          setActiveBlock(newActive);
          return {
            projectId,
            pipelineId: pipelineId,
            rootId: prevValue?.id,
            id: 'new',
            status: 0,
            omeroIds: jobs[prevValue?.id]?.omeroIds,
            ...newActive[0],
          };
        } else {
          setAvailableBlocks( { });
        }
        return prevValue;
      });
    }
  };

  useEffect(
    () => {
      if (pipeline || !projectId || !pipelineId) {
        return;
      }
      dispatch(pipelineActions.fetchPipeline({ projectId, pipelineId }));
    },
    [dispatch, pipeline, projectId, pipelineId],
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
          pipelineId: pipelineId,
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
    [selectedBlock, jobs, projectId, pipelineId, jobTypes],
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
      dispatch(jobsActions.fetchJobsByPipelineId(pipelineId));
      return () => {
        dispatch(jobsActions.clearJobs());
      };
    },
    [dispatch, refresher, pipelineId],
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
    [sidebarWidth],
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

  const verticalResizerStyles = {
    width: '5px',
    cursor: 'col-resize',
    zIndex: 1,
    boxSizing: 'border-box',
    background: 'linear-gradient(to right, transparent 1px, #ccc 1px, #ccc 4px, transparent 1px)',
  };

  const horizontalResizerStyles = {
    height: '5px',
    cursor: 'row-resize',
    zIndex: 1,
    boxSizing: 'border-box',
    background: 'linear-gradient(to bottom, transparent 1px, #ccc 1px, #ccc 2px, transparent 1px)',
  };

  return (
    <ReactFlowProvider>
      <Grid
        container
        spacing={2}
        direction='row'
      >
        <SplitPane
          sizes={sizes}
          split="vertical"
          minSize={200 + sidebarWidth}
          size={700}
          resizerStyle={verticalResizerStyles}
          onChange={(size) => setSizes([size, 1000 - size])}
          style={{ marginLeft: sidebarWidth }}
        >
          <div style={{ height: '100%', maxHeight: '100%', flexDirection: 'row' }}>
            <SplitPane
              split="horizontal"
              resizerStyle={horizontalResizerStyles}
              minSize={200}
              size={250}
              style={{ height: '35%' }}
            >
              <Grid
                item
                container
                xs={12}
                style={{ paddingLeft: '6px', height: '100%' }}
              >
                <Grid
                  item
                  container
                  xs={12}
                  style={{ height: '60%' }}
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
                      <Controls showInteractive={false} style={{ position: 'absolute', left: 0, display: 'flex' }} />
                      <Background />
                    </ReactFlow>
                  </FlowWrapper>
                </Grid>
                <Grid
                  item
                  container
                  direction='column'
                  xs={12}
                  style={{ height: '40%' }}
                >
                  <BlockScrollWrapper>
                    <BlocksScroll
                      items={selectedBlock ? availableBlocks[selectedBlock?.script_path] : availableBlocks['initial']}
                      onClick={handleBlockClick}
                    />
                  </BlockScrollWrapper>
                </Grid>
              </Grid>
              <Grid
                item
                container
                direction='column'
                xs={12}
                style={{ paddingLeft: '6px', height: '75%' }}
              >
                <BlockSettingsFormWrapper>
                  {selectedBlock?.id ? (
                    <BlockSettingsForm
                      block={selectedBlock}
                      onRestart={onJobRestart}
                      onSubmit={onJobSubmit}
                      onClose={onJobCancel}
                    />
                  ) : (
                    <NoData>Select block</NoData>
                  )}
                </BlockSettingsFormWrapper>
              </Grid>
            </SplitPane>
          </div>
          <div>
            <Grid
              item
              xs={12}
            >
              <Container>
                <ImageViewerContainer>
                  {selectedImagesDetails[activeImageIds[0]] && (
                    <ImageViewer
                      data={projectImagesDetails[activeImageIds[0]]}
                    />
                  )}
                  <ThumbnailsViewer
                    thumbnails={projectImagesOptions}
                    active={activeImageIds[0]}
                    onClick={setActiveImageIds}
                  />
                </ImageViewerContainer>
              </Container>
            </Grid>
          </div>
        </SplitPane>
      </Grid>

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

Process.propTypes = {
  // eslint-disable-next-line react/require-default-props
  sidebarWidth: PropTypes.number,
};

export default Process;
