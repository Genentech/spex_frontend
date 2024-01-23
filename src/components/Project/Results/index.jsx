import React, {
  Fragment, useState, useMemo, useCallback, useEffect, useRef,
} from 'react';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import DeleteIcon from '@material-ui/icons/Delete';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Refresh from '@material-ui/icons/Refresh';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import classNames from 'classnames';
import dagre from 'dagre';
import cloneDeep from 'lodash/cloneDeep';
import PropTypes from 'prop-types';
import ReactFlow, { isNode } from 'react-flow-renderer';
import { useDispatch, useSelector } from 'react-redux';
import { matchPath, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Vitessce } from 'vitessce';

import JobBlock from '@/components/Project/Process/blocks/JobBlock';
import PathNames from '@/models/PathNames';

import { actions as omeroActions, selectors as omeroSelectors } from '@/redux/modules/omero';
import { actions as pipelineActions, selectors as pipelineSelectors } from '@/redux/modules/pipelines';
import { selectors as projectSelectors } from '@/redux/modules/projects';
import { actions as tasksActions, selectors as tasksSelectors } from '@/redux/modules/tasks';

import Button from '+components/Button';
import ClickAwayListener from '+components/ClickAwayListener';
import Grow from '+components/Grow';
import MenuList, { MenuItem } from '+components/MenuList';
import Message from '+components/Message';
import Paper from '+components/Paper';
import Popper from '+components/Popper';
import Tabs, { Tab, TabPanel } from '+components/Tabs';
import { Box } from '+components/Tabs';
import ButtonsContainer from '../components/ButtonsContainer';

const flowDirection = 'LR';
const nodeWidth = 172;
const nodeHeight = 36;

const nodeTypes = {
  job: JobBlock,
};

const TasksBlock = styled.div`
  max-width: 100%;
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


const Results = ( { sidebarWidth } ) => {
  const dispatch = useDispatch();
  const location = useLocation();

  const matchProjectPath = matchPath(location.pathname, { path: `/${PathNames.projects}/:id` });
  const projectId = matchProjectPath ? matchProjectPath.params.id : undefined;
  const project = useSelector(projectSelectors.getProject(projectId));
  const matchPipelinePath = matchPath(location.pathname, {
    path: `/${PathNames.projects}/${projectId}/${PathNames.processes}/:id`,
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pipelineId = matchPipelinePath ? matchPipelinePath.params.id : undefined;
  const pipelines = useSelector(pipelineSelectors.getPipelinesWithTasksForVis(pipelineId) || {});
  const tasksVitessceConfigs = useSelector(tasksSelectors.getTaskVitessceConfigs || {});
  const [taskToPanels, setTasksToPanels] = useState([]);
  const [taskToPipeline, setTasksToPipeline] = useState([]);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [open, setOpen] = useState(false);
  const [currImages, setCurrImages] = useState({});
  const [selectedRows, setSelectedRows] = useState([]);
  const omeroWeb = useSelector(omeroSelectors.getOmeroWeb);
  // eslint-disable-next-line no-unused-vars
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const pipeline = useSelector(pipelineSelectors.getPipeline(projectId, pipelineId));
  const error = useSelector(tasksSelectors.getDataMessage);
  const anchorRef = useRef(null);
  const [manageImagesModalOpen, setManageImagesModalOpen] = useState(false);
  const [manageTasksModalOpen, setManageTasksModalOpen] = useState(false);
  const [manageFilesModalOpen, setManageFilesModalOpen] = useState(false);


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
        },
      };

      const pipelineClone = cloneDeep(pipeline);

      if (selectedBlock && selectedBlock.rootId && selectedBlock.id === 'new') {
        // addNewVirtualJobToPipeline(selectedBlock.rootId, selectedBlock, pipelineClone);
      }

      _elements = createElements(pipelineClone, _elements, options, selectedBlock);
      if (_elements.length > 1) {
        _elements.splice(1, 1);
      }
      return createGraphLayout(_elements, flowDirection);
    },
    [pipeline, selectedBlock],
  );
  const onLoad = useCallback(
    (instance) => {
      setReactFlowInstance(instance);
    },
    [setReactFlowInstance],
  );

  const onManageFilesModalOpen = useCallback(() => {
    setManageFilesModalOpen(true);
  }, []);

  const onManageFilesModalClose = useCallback(() => {
    setManageFilesModalOpen(false);
  }, []);

  const onKeyDownInMenu = useCallback(
    (event) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        setOpen(false);
      }
    },
    [setOpen],
  );

  const handleAccordionChange = useCallback((id) => {
    setActiveAccordion((activeAccordion) => activeAccordion === id ? null : id);
  }, []);


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

  const jobs_data = useMemo(
    () => {
      if (pipelines === undefined) {
        return [];
      }
      if (pipelines.length === 0 || Object.keys(pipelines).length === 0) {
        return [];
      }
      if (pipelines && pipelines.id === pipelineId) {
        return pipelines['jobs'];
      }
      return [];
    },
    [pipelines, pipelineId],
  );


  useEffect(
    () => {
      if (omeroWeb === null) {
        return;
      }

      dispatch(omeroActions.fetchOmeroWeb());
    },
    [dispatch, omeroWeb],
  );

  const onToggle = useCallback(
    () => {
      setOpen((prevOpen) => !prevOpen);
    },
    [setOpen],
  );

  const onToggleClose = useCallback(
    (event) => {
      if (anchorRef.current && anchorRef.current.contains(event.target)) {
        return;
      }
      setOpen(false);
    },
    [setOpen],
  );


  const columns = useMemo(
    () => ([
      {
        id: 'id',
        accessor: 'id',
        Header: 'id',
        Cell: ({ row: { original: { id } } }) => useMemo(
          () => (
            // <Link to={`/${PathNames.jobs}/${id}`}>
            <div> {id} </div>
            // </Link>
          ),
          [id],
        ),
      },
      {
        id: 'omeroIds',
        accessor: 'omeroIds',
        Header: 'OMERO IDs',
        Cell: ({ row: { original: { omeroIds } } }) => useMemo(
          () => (
            <div>{omeroIds.map((omero) => omero).join(', ')}</div>
          ),
          [omeroIds],
        ),
      },
      {
        id: 'status',
        accessor: 'status',
        Header: 'Status',
        Cell: ({ row: { original: { status } } }) => useMemo(
          () => {
            if (status == null) {
              return 'N/A';
            }
            if (Math.round(status) === 0) {
              return 'Waiting To Process';
            }
            if (Math.round(status) === 100) {
              return 'Done';
            }
            return 'In Progress';
          },
          [status],
        ),
      }, {
        id: 'name',
        accessor: 'name',
        Header: 'job name',
      }]),
    [],
  );

  useEffect(
    () => {
      if (!projectId && !pipelineId) {
        return;
      }
      dispatch(pipelineActions.fetchPipelinesForVis( { projectId, pipelineId } ));
    },
    [dispatch, projectId, pipelineId],
  );

  useEffect(() => {
    if (pipelines === undefined) {
      return [];
    }
    let taskList = [];
    let clusterList = [];
    if (Object.keys(pipelines).length !== 0) {
      jobs_data.forEach(function (o) {
        if (o.name !== 'phenograph_cluster') {
          taskList = [...taskList, ...o.tasks];
        } else {
          clusterList = [...o.tasks];
        }
      });
    }
    if (taskList.length !== taskToPanels.length) {
      setTasksToPanels(taskList);
    }
    if (clusterList.length !== taskToPipeline.length) {
      setTasksToPipeline(clusterList);
    }
  }, [jobs_data, taskToPanels, pipelines, taskToPanels]);

  const handleDeleteTaskData = useCallback((taskId) => {
    dispatch(tasksActions.deleteTaskData(taskId));
  }, [dispatch]);

  const handleUpdateTaskData = useCallback((taskId) => {
    dispatch(tasksActions.checkTaskData(taskId));
  }, [dispatch]);


  const errorMessage = useMemo(() => {
      return error.message || 'An error occurred';
  }, [error]);

  const allImageIds = useMemo(() => {
    let pairs = [];
    taskToPanels.forEach((task) => {
      if (task.omeroId) {
        pairs.push([task.id, task.omeroId]);
      }
    });
    return pairs;
  }, [taskToPanels]);

  const handleImageSelect = useCallback(([taskId, omeroId]) => {
    console.log(`Task ID: ${taskId}, OMERO ID: ${omeroId}`);
  }, []);

  const tabsData = useMemo(
    () => {
      if (jobs_data.length === 0 || selectedRows.length === 0) {
        return [];
      }
      let tabs = [];
      let pipelines_job_ids = [];
      jobs_data.forEach((job) => {
        pipelines_job_ids.push(job.id);
      });

      tabs = selectedRows.filter(((n) => pipelines_job_ids.includes(n)));

      return tabs;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedRows, jobs_data],
  );


  useEffect(
    () => {
      taskToPanels.forEach((item) => {
        dispatch(tasksActions.fetchTaskVitessce(item.id));
      });
      taskToPipeline.forEach((item) => {
        dispatch(tasksActions.fetchTaskVitessce(item.id));
      });
    },
    [dispatch, taskToPanels, taskToPipeline],
  );

  useEffect(() => {
    if (taskToPipeline.length > 1) {
      setTasksToPipeline(taskToPipeline.slice(0, 1));
    }
  }, [taskToPipeline]);

    const [expanded, setExpanded] = useState(null);
    const [previousType, setPreviousType] = useState(null);

    const handleChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : null);
    };

    const [expandedTab, setExpandedTab] = useState(null);
    const handleChangeTabe = (event, newValue) => {
        setExpandedTab(newValue);
    };

    return (
      <Fragment>

        <Box>
          {Object.values(tabsData).map((type) => (
            <Tab
              key={type}
              label={type}
              value={type}
            />
                ))}
        </Box>

        <TasksBlock>
          <Accordion style={{ backgroundColor: 'white' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <div> Process </div>
            </AccordionSummary>
            <AccordionDetails>
              {taskToPipeline.map((type) => (
                <div key={type.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ marginRight: 10 }}> id:{type.id}/{type.name}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="inherit"
                        startIcon={<Refresh />}
                        onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateTaskData(type.id);
                        }}
                      >
                        create zarr data
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="inherit"
                        startIcon={<DeleteIcon />}
                        onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTaskData(type.id);
                        }}
                      >
                        delete zarr data
                      </Button>

                    </div>
                  </span>
                  <div style={{ height: '100vh', width: '100vw' }}>
                    <Vitessce
                      config={tasksVitessceConfigs[type.id]}
                      height={800}
                      theme="light"
                    />
                  </div>
                </div>
                        ))}
            </AccordionDetails>
          </Accordion>

          <Fragment style={{ marginTop: '16px' }}>
            <Tabs
              value={expandedTab}
              onChange={handleChangeTabe}
              variant="fullWidth"
            >
              {taskToPanels.map((type) => (
                <Tab key={type.id} label={`Image ID: ${type.omeroId}`} value={type.id} />
                    ))}
            </Tabs>
            {taskToPanels.map((type) => (
              <TabPanel key={type.id} value={expandedTab} index={type.id}>

                {(type.id === expandedTab) && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ marginRight: 10 }}> id:{type.id}/{type.name}</span>
                    <div style={{ height: '100vh', width: '100vw' }} id={type.id}>
                      <Vitessce
                        config={tasksVitessceConfigs[type.id]}
                        height={800}
                        theme="light"
                      />
                    </div>
                    <ImageList cols={2}>
                      {Object.keys(Object(currImages[type.id])).map((key) => (
                        <ImageListItem key={`${type.id}-${key}-${type.id}`}>
                          <p>
                            <Box
                              key={`${type.id}-${key}-${type.id}`}
                              component="img"
                              src={currImages[type.id][key]}
                              alt={key}
                            />
                          </p>
                        </ImageListItem>
                  ))}
                    </ImageList>
                  </div>
            )}
              </TabPanel>
                ))}
          </Fragment>

          <ButtonsContainer>
            <Button
              ref={anchorRef}
              aria-controls={open ? 'menu-list-grow' : undefined}
              aria-haspopup="true"
              onClick={onToggle}
            >
              Manage
            </Button>

            <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition>
              {({ TransitionProps, placement }) => (
                <Grow
                  {...TransitionProps}
                  style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
                >
                  <Paper>
                    <ClickAwayListener onClickAway={onToggleClose}>
                      <MenuList>
                        {allImageIds.map(([taskId, omeroId]) => (
                          <MenuItem key={`${taskId}-${omeroId}`} onClick={() => handleImageSelect([taskId, omeroId])}>
                            Task ID: {taskId}, OMERO ID: {omeroId}
                          </MenuItem>
                                            ))}
                      </MenuList>
                    </ClickAwayListener>
                  </Paper>
                </Grow>
                        )}
            </Popper>
          </ButtonsContainer>
        </TasksBlock>
        {errorMessage && <Message message={errorMessage} />}
        <div style={{ height: 200, width: '100%', position: 'absolute', left: '-9999px' }}>
          <ReactFlow
            id='react-flow__pane_2'
            nodeTypes={nodeTypes}
            elements={elements}
            onLoad={onLoad}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            snapToGrid
          />
        </div>
      </Fragment>
    );
};


Results.propTypes = {
  // eslint-disable-next-line react/require-default-props
  sidebarWidth: PropTypes.number,
};

export default Results;
