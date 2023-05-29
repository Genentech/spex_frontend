import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Grid from '@material-ui/core/Grid';
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

import BlocksScroll from '+components/BlocksScroll';
import ConfirmModal, { ConfirmActions } from '+components/ConfirmModal';
import ImageViewer from '+components/ImageViewer';
import NoData from '+components/NoData';
import ThumbnailsViewer from '+components/ThumbnailsViewer';

import JobBlock from './blocks/JobBlock';
import StartBlock from './blocks/StartBlock';
import AddBlockForm from './components/AddBlockForm';
import BlockSettingsForm from './components/BlockSettingsForm';
import BlockSettingsFormWrapper from './components/BlockSettingsFormWrapper';
import Container from './components/Container';
import FlowWrapper from './components/FlowWrapper';


const jobRefreshInterval = 6e4; // 1 minute

const flowDirection = 'LR';
const nodeWidth = 172;
const nodeHeight = 36;

const nodeTypes = {
  start: StartBlock,
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

const Process = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const matchProjectPath = matchPath(location.pathname, { path: `/${PathNames.projects}/:id` });
  const projectId = matchProjectPath ? matchProjectPath.params.id : undefined;
  const project = useSelector(projectsSelectors.getProject(projectId));
  const projectImagesDetails = useSelector(omeroSelectors.getImagesDetails(project?.omeroIds || []));
  const [activeImageIds, setActiveImageIds] = useState(project?.omeroIds || []);
  const [activeBlock, setActiveBlock] = useState([]);

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

  useEffect(
    () => {
      if (!selectedBlock || Object.keys(jobTypes).length === 0) {
        return;
      }
      if ( availableBlocks[selectedBlock.script_path] === undefined) {
      // eslint-disable-next-line no-console
        let blocks = [];
        Object.keys(jobTypes).forEach((jobType) => {
          jobTypes[jobType]['stages'].forEach((stage) => {
              stage['scripts'].forEach((block) => {
                const enabled = block.depends_and_script?.includes(selectedBlock.script_path)
                  || block.depends_or_script?.includes(selectedBlock.script_path);
                if (enabled) {
                  blocks.push(block);
                }
              });
          });
        });
        let val = {};
        val[selectedBlock.name] = blocks;
        setAvailableBlocks( { ...val } );
      }
    },
    [selectedBlock, availableBlocks, jobTypes],
  );

  const onStartPipeline = useCallback(
    () => {
      dispatch(jobsActions.startPipeline(pipelineId));
    },
    [dispatch, pipelineId],
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
      await dispatch(jobsActions.fetchJobsByPipelineId(pipelineId));

      const job = jobs[block.id];
      if (!job) {
        setSelectedBlock({
          projectId,
          pipelineId: pipelineId,
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

  const onBlockAdd = useCallback(
    (block) => {
      setActionWithBlock(null);

      setSelectedBlock((prevValue) => ({
        projectId,
        pipelineId: pipelineId,
        rootId: prevValue?.id,
        id: 'new',
        status: 0,
        omeroIds: jobs[prevValue?.id]?.omeroIds,
        ...block,
      }));
    },
    [jobs, pipelineId, projectId],
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

  const handleBlockClick = (newActive) => {
    setActiveBlock(newActive);
    if (newActive.length === 1) {
      setSelectedBlock((prevValue) => {
        if (prevValue.id !== 'new') {
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
          xs={4}
        >
          <Grid
            item
            container
            direction='column'
            xs={12}
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
            xs={12}
            style={{ height: '20%' }}
          >
            <BlocksScroll
              items={availableBlocks[selectedBlock?.script_path]}
              onClick={handleBlockClick}
              active={activeBlock}
            />
          </Grid>
          <Grid
            item
            container
            direction='column'
            xs={12}
            style={{ height: '50%' }}
          >
            <BlockSettingsFormWrapper>
              {selectedBlock?.id ? (
                <BlockSettingsForm
                  block={selectedBlock}
                  onRestart={onJobRestart}
                />
              ) : (
                <NoData>Select block</NoData>
              )}
            </BlockSettingsFormWrapper>
          </Grid>
        </Grid>
        <Grid
          item
          xs={8}
        >
          <Container>
            <ImageViewerContainer>
              {projectImagesDetails[activeImageIds[0]] && (
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
