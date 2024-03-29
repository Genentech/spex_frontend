import React, {
  Fragment, useState, useMemo, useCallback, useEffect, useRef,
} from 'react';
import { Launch } from '@material-ui/icons';
import ClearIcon from '@material-ui/icons/Clear';
import DeleteIcon from '@material-ui/icons/Delete';
import Refresh from '@material-ui/icons/Refresh';
import classNames from 'classnames';
import dagre from 'dagre';
import cloneDeep from 'lodash/cloneDeep';
import PropTypes from 'prop-types';
import ReactFlow, { isNode } from 'react-flow-renderer';
import { useDispatch, useSelector } from 'react-redux';
import { matchPath, useLocation, withRouter } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { Vitessce } from 'vitessce';

import JobBlock from '@/components/Project/Process/blocks/JobBlock';
import PathNames from '@/models/PathNames';

import { actions as omeroActions, selectors as omeroSelectors } from '@/redux/modules/omero';
import { actions as pipelineActions, selectors as pipelineSelectors } from '@/redux/modules/pipelines';
import { actions as tasksActions, selectors as tasksSelectors } from '@/redux/modules/tasks';

import Button from '+components/Button';
import Message from '+components/Message';
import Tabs, { Tab, TabPanel } from '+components/TabsImages';

const flowDirection = 'LR';
const nodeWidth = 172;
const nodeHeight = 36;

const nodeTypes = {
  job: JobBlock,
};
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

const TasksBlock = styled.div`
    max-width: 100%;
`;

const DivIcon = styled.div`
      position: absolute;
      top: 2px;
      right: 2px;
  `;

const Results = ( { sidebarWidth, processReviewTabName } ) => {
  const dispatch = useDispatch();
  const location = useLocation();

  const matchProjectPath = matchPath(location.pathname, { path: `/${PathNames.projects}/:id` });
  const projectId = matchProjectPath ? matchProjectPath.params.id : undefined;
  const matchPipelinePath = matchPath(location.pathname, {
    path: `/${PathNames.projects}/${projectId}/${PathNames.processes}/:id`,
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pipelineId = matchPipelinePath ? matchPipelinePath.params.id : undefined;
  const pipelines = useSelector(pipelineSelectors.getPipelinesWithTasksForVis(pipelineId) || {});
  const tasksVitessceConfigs = useSelector(tasksSelectors.getTaskVitessceConfigs || {});
  const [taskToPanels, setTasksToPanels] = useState([]);
  const [taskToPipeline, setTasksToPipeline] = useState([]);
  const omeroWeb = useSelector(omeroSelectors.getOmeroWeb);
  // eslint-disable-next-line no-unused-vars
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const pipeline = useSelector(pipelineSelectors.getPipeline(projectId, pipelineId));
  const error = useSelector(tasksSelectors.getDataMessage);

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

  useEffect(
    () => {
      if (!projectId && !pipelineId) {
        return;
      }
      dispatch(pipelineActions.fetchPipelinesForVis( { projectId, pipelineId } ));
    },
    [dispatch, projectId, pipelineId],
  );

  const prevTaskToPanels = useRef([]);
  const prevTaskToPipeline = useRef([]);

  useEffect(() => {
    if (pipelines === undefined) {
      return;
    }

    let taskList = [];
    let clusterList = [];

    jobs_data.forEach(function (o) {
      if (o.name !== 'phenograph_cluster') {
        taskList.push(...o.tasks);
      } else {
        clusterList.push(...o.tasks);
      }
    });

    if (prevTaskToPanels.current.length !== taskList.length) {
      setTasksToPanels(taskList);
      prevTaskToPanels.current = taskList;
    }

    if (prevTaskToPipeline.current.length !== clusterList.length) {
      setTasksToPipeline(clusterList);
      prevTaskToPipeline.current = clusterList;
    }
  }, [jobs_data, pipelines, setTasksToPanels, setTasksToPipeline]);




  const handleDeleteTaskData = useCallback((taskId) => {
    dispatch(tasksActions.deleteTaskData(taskId));
  }, [dispatch]);

  const handleUpdateTaskData = useCallback((taskId) => {
    dispatch(tasksActions.checkTaskData(taskId));
  }, [dispatch]);


  const errorMessage = useMemo(() => {
    return error.message || 'An error occurred';
  }, [error]);



  useEffect(() => {
    taskToPanels.forEach((item) => {
      dispatch(tasksActions.fetchTaskVitessce(item.id, processReviewTabName));
    });
    taskToPipeline.forEach((item) => {
      dispatch(tasksActions.fetchTaskVitessce(item.id, processReviewTabName));
    });
  }, [dispatch, taskToPanels, taskToPipeline, processReviewTabName]);


  useEffect(() => {
    if (taskToPipeline.length > 1) {
      setTasksToPipeline(taskToPipeline.slice(0, 1));
    }
  }, [taskToPipeline]);


  const [expandedTab, setExpandedTab] = useState( 'dataset');




  const history = useHistory();
  const handleChangeTabe = (event, newValue) => {
    setExpandedTab(newValue);
    const matchPipelinePath = matchPath(location.pathname, {
      path: `/${PathNames.projects}/${projectId}/${PathNames.processes}/:id`,
    });

    if (matchPipelinePath) {
      const newUrl = `/projects/${projectId}/processes/${matchPipelinePath.params.id}/review/${newValue}`;
      history.push(newUrl);
    }
  };

  const handleOpenInNewTab = (value) => {
    const tabLink = `/projects/${projectId}/processes/${matchPipelinePath.params.id}/review/${value}`;
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    window.open(tabLink, '_blank');
  };


  const [searchInput, setSearchInput] = useState('');
  const handleSearchInputChange = (event) => {
    const { value } = event.target;
    const onlyDigits = value.replace(/\D/g, '');
    setSearchInput(onlyDigits);
  };

  const filteredTaskToPanels = useMemo(() => {
    if (!searchInput.trim()) {
      return taskToPanels;
    }
    return taskToPanels.filter((type) => type.omeroId.startsWith(searchInput.trim()));
  }, [searchInput, taskToPanels]);

  const handleClearSearchInput = () => {
    setSearchInput('');
  };

  const inputContainerStyle = {
    position: 'relative',
    display: 'inline-block',
  };

  const inputStyle = {
    paddingRight: '30px',
    width: '100%',
    border: '1px solid #ccc',
    borderRadius: '5px',
    padding: '5px',
  };

  const clearIconStyle = {
    position: 'absolute',
    top: '50%',
    right: '10px',
    transform: 'translateY(-50%)',
    cursor: 'pointer',
    color: '#555',
    fontSize: '18px',
  };

  useEffect(() => {
    if (processReviewTabName && filteredTaskToPanels.length>0) {
      setExpandedTab(processReviewTabName);
    } else {
      setExpandedTab('dataset');
    }
  }, [processReviewTabName, filteredTaskToPanels]);

  return (
    <Fragment>
      <TasksBlock>
        <Fragment>
          <div style={{ position: 'relative', width: '300px', marginBottom: '10px' }}>
            <div style={inputContainerStyle}>
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchInputChange}
                placeholder="Search by image number"
                style={inputStyle}
              />
              {searchInput && (
                <ClearIcon
                  onClick={handleClearSearchInput}
                  style={clearIconStyle}
                />
              )}
            </div>
          </div>
          <Tabs
            value={expandedTab}
            onChange={handleChangeTabe}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              label={
                <div>
                  <div>
                    Dataset
                  </div>
                  <DivIcon onClick={() => handleOpenInNewTab('dataset')}>
                    <Launch style={{ fontSize: 16 }} />
                  </DivIcon>
                </div>
              }
              value="dataset"
            />

            {filteredTaskToPanels.length !== 0 && filteredTaskToPanels.map((type) => (
              <Tab
                key={type.id}
                label={
                  <div>
                    <div>
                      {type.omeroId}
                    </div>
                    <DivIcon onClick={() => handleOpenInNewTab(type.omeroId)}>
                      <Launch style={{ fontSize: 16 }} />
                    </DivIcon>
                  </div>
                }
                value={type.omeroId}
              />
            ))}
          </Tabs>
          <TabPanel value={expandedTab} index="dataset">
            {(expandedTab === 'dataset') && (
              taskToPipeline.map((type) => (
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
                      </Button >
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
                      </Button >
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
              )))}
          </TabPanel>
          { taskToPanels.length !== 0 && taskToPanels.map((type) => {
              return (
                <TabPanel key={type.id} value={expandedTab} index={type.omeroId}>
                  {
                    (type.omeroId === expandedTab) && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
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
                            </Button >
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
                            </Button >
                          </div>
                        </span>
                        <div style={{ height: '100vh', width: '100vw' }} id={type.id}>
                          <Vitessce
                            config={tasksVitessceConfigs[type.id]}
                            height={800}
                            theme="light"
                          />
                        </div>
                      </div>
                    )
                  }
                </TabPanel>
              );
            },
          )}
        </Fragment>
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
  // eslint-disable-next-line react/forbid-prop-types,react/require-default-props
  processReviewTabName: PropTypes.string,
};

// export default Results;
export default withRouter(Results);
