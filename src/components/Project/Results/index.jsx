import React, {
  Fragment, useState, useMemo, useCallback, useEffect, useRef,
} from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
} from '@material-ui/core';
import BottomNavigation from '@material-ui/core/BottomNavigation';
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction';
import { Launch } from '@material-ui/icons';
import ClearIcon from '@material-ui/icons/Clear';
import DeleteIcon from '@material-ui/icons/Delete';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FolderIcon from '@material-ui/icons/Folder';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import Refresh from '@material-ui/icons/Refresh';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
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
import { actions as processActions, selectors as processSelectors } from '@/redux/modules/processes';
import { actions as tasksActions, selectors as tasksSelectors } from '@/redux/modules/tasks';
import Button from '+components/Button';
import Message from '+components/Message';
import SelectNew from '+components/SelectNew';
import Tabs, { Tab, TabPanel } from '+components/TabsImages';

const StyledTabLabel = styled.div`
  white-space: normal;
  overflow: hidden;
  max-width: 100px;
  word-wrap: break-word;
  font-size: 11px;
  line-height: 1;
  padding: 0 5px;
`;

const flowDirection = 'LR';
const nodeWidth = 172;
const nodeHeight = 36;

const nodeTypes = {
  job: JobBlock,
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
      top: 0;
      right: 0;
  `;

const Results = ( { sidebarWidth, processReviewTabName } ) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const matchProjectPath = matchPath(location.pathname, { path: `/${PathNames.projects}/:id` });
  const projectId = matchProjectPath ? matchProjectPath.params.id : undefined;
  const matchProcessPath = matchPath(location.pathname, {
    path: `/${PathNames.projects}/${projectId}/${PathNames.processes}/:id`,
  });
  const processId = matchProcessPath ? matchProcessPath.params.id : undefined;
  const processes = useSelector(processSelectors.getProcessesWithTasksForVis(processId) || {});
  const tasksVitessceConfigs = useSelector(tasksSelectors.getTaskVitessceConfigs || {});
  const [taskToPanels, setTasksToPanels] = useState([]);
  const [taskToProcess, setTasksToProcess] = useState([]);
  const omeroWeb = useSelector(omeroSelectors.getOmeroWeb);
  const [selectedBlock] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const process = useSelector(processSelectors.getProcess(projectId, processId));
  const error = useSelector(tasksSelectors.getDataMessage);
  const [selectedValues, setSelectedValues] = useState([]);
  const varNames = useSelector(tasksSelectors.getVarNames || {});
  const clusters = useSelector(tasksSelectors.getClusters || {});

  const [showVitessce] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [showSelectNew, setShowSelectNew] = useState(false);
  const [showSelectGrid, setShowSelectGrid] = useState(false);


  const fetchZarrStructure = useCallback(async (id) => {
    try {
      await dispatch(tasksActions.getVarNames(id));
    } catch (error) {
      // handle error
    }
  }, [dispatch]);

  useEffect(() => {
    if (processId) {
      fetchZarrStructure(processId);
    }
  }, [fetchZarrStructure, processId]);

  const handleSelectedChannelsChange = (newValue) => {
    setSelectedValues(newValue);
  };

  useEffect(() => {
    setShowSelectGrid(true);
  }, []);

  const options = useMemo(
    () => Array.isArray(varNames) ? varNames.map((name, index) => ({ value: name, label: name, color: (index % 2 === 0 ? 'red' : 'blue') })) : [],
    [varNames],
  );

  useEffect(() => {
    if (options.length > 0) {
      setSelectedValues(options.map((option) => option.value));
    };
  }, [options]);

  const elements = useMemo(
    () => {
      let _elements = [];

      if (!process) {
        return _elements;
      }

      const options = {
        position: { x: 0, y: 0 },
        data: {
          direction: flowDirection,
        },
      };

      const processClone = cloneDeep(process);

      _elements = createElements(processClone, _elements, options, selectedBlock);
      if (_elements.length > 1) {
        _elements.splice(1, 1);
      }
      return createGraphLayout(_elements, flowDirection);
    },
    [process, selectedBlock],
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
      if (processes === undefined) {
        return [];
      }
      if (processes.length === 0 || Object.keys(processes).length === 0) {
        return [];
      }
      if (processes && processes.id === processId) {
        return processes['jobs'];
      }
      return [];
    },
    [processes, processId],
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
      if (!projectId && !processId) {
        return;
      }
      dispatch(processActions.fetchProcessesForVis( { projectId, processId } ));
    },
    [dispatch, projectId, processId],
  );

  const prevTaskToPanels = useRef([]);
  const prevTaskToProcess = useRef([]);

  useEffect(() => {
    if (processes === undefined) {
      return;
    }

    let taskList = [];
    let clusterList = [];

    jobs_data.forEach(function (o) {
      if (o.name !== 'phenograph_cluster' && o.name !== 'Cluster ST data') {
        taskList.push(...o.tasks);
      } else {
        clusterList.push(...o.tasks);
      }
    });

    if (prevTaskToPanels.current.length !== taskList.length) {
      setTasksToPanels(taskList);
      prevTaskToPanels.current = taskList;
    }

    if (prevTaskToProcess.current.length !== clusterList.length) {
      setTasksToProcess(clusterList);
      prevTaskToProcess.current = clusterList;
    }
  }, [jobs_data, processes, setTasksToPanels, setTasksToProcess]);




  const handleDeleteTaskData = useCallback((taskId) => {
    dispatch(tasksActions.deleteTaskData(taskId));
  }, [dispatch]);

  const handleUpdateTaskData = useCallback((taskId) => {
    dispatch(tasksActions.checkTaskData(taskId));
  }, [dispatch]);

  const handleSaveZarrData = (id) => {
    dispatch(tasksActions.saveZarrData({ id, selectedValues, rows }));
  };

  const errorMessage = useMemo(() => {
    return error.message || 'An error occurred';
  }, [error]);

  const columns = [
    {
      field: 'c1',
      headerName: 'cluster name',
      width: 180,
      editable: false,
    },
    {
      field: 'c2',
      headerName: 'new cluster name',
      width: 220,
      editable: true,
    },
  ];

  const rows = useMemo(() => {
    if (!clusters || clusters.length === 0) {
      return [];
    }

    return clusters.map((cluster, index) => ({
      id: index + 1,
      c1: cluster,
      c2: cluster,
    }));
  }, [clusters]);

  useEffect(() => {
    taskToPanels.forEach((item) => {
      dispatch(tasksActions.fetchTaskVitessce(item.id, processReviewTabName));
    });
    taskToProcess.forEach((item) => {
      dispatch(tasksActions.fetchTaskVitessce(item.id, processReviewTabName));
    });
  }, [dispatch, taskToPanels, taskToProcess, processReviewTabName]);


  useEffect(() => {
    if (taskToProcess.length > 1) {
      setTasksToProcess(taskToProcess.slice(0, 1));
    }
  }, [taskToProcess]);


  const [expandedTab, setExpandedTab] = useState( 'dataset');

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(showVitessce);
  }, [showVitessce]);


  const history = useHistory();
  const handleChangeTabe = (event, newValue) => {
    setExpandedTab(newValue);
    const matchProcessPath = matchPath(location.pathname, {
      path: `/${PathNames.projects}/${projectId}/${PathNames.processes}/:id`,
    });

    if (matchProcessPath) {
      const newUrl = `/projects/${projectId}/processes/${matchProcessPath.params.id}/review/${newValue}`;
      history.push(newUrl);
    }
  };

  const handleOpenInNewTab = (value) => {
    const tabLink = `/projects/${projectId}/processes/${matchProcessPath.params.id}/review/${value}`;
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    window.open(tabLink, '_blank');
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    setShowSelectNew(newValue === 1);
    setShowSelectGrid(newValue === 0);
  };


  const [searchInput, setSearchInput] = useState('');
  const handleSearchInputChange = (event) => {
    const { value } = event.target;
    // const onlyDigits = value.replace(/\D/g, '');
    setSearchInput(value);
  };

  const filteredTaskToPanels = useMemo(() => {
    if (!searchInput.trim()) {
      return taskToPanels;
    }
    const searchQuery = searchInput.trim().toLowerCase();
    return taskToPanels.filter((type) => {
      if (type.omeroId === '') {
        return (`id:${type.id}/${type.name}`).toLowerCase().includes(searchQuery);
      } else {
        return type.omeroId.toLowerCase().includes(searchQuery);
      }
    });
  }, [searchInput, taskToPanels]);

  const handleAccordionChange = useCallback(async (taskId) => {
    try {
      const varNames = await dispatch(tasksActions.getVarNames(taskId));
      const newValues = varNames.map((name) => ({ value: name, label: name }));
      if (selectedValues.length === 0) {
        setSelectedValues(newValues);
      };
    } catch (error) {

    }
  }, [dispatch, selectedValues.length]);

  const handleRefreshVitessce = (taskId) => {
    window.location.reload(true);
    window.location.href = window.location.href.split('?')[0] + '?disableCache=' + new Date().getTime();
  };

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
                placeholder="Search"
                style={inputStyle}
              />

              {searchInput ? <ClearIcon
                onClick={handleClearSearchInput}
                style={clearIconStyle}
                             /> : null}
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
                  <StyledTabLabel>
                    Dataset
                  </StyledTabLabel>

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
                      <StyledTabLabel>
                        {type.omeroId === '' ? `id:${type.id}/${type.name}` : type.omeroId}
                      </StyledTabLabel>

                    </div>

                    <DivIcon onClick={() => handleOpenInNewTab(type.id)}>
                      <Launch style={{ fontSize: 16 }} />
                    </DivIcon>
                  </div>
                }
                value={type.id}
              />
            ))}
          </Tabs>

          <TabPanel value={expandedTab} index="dataset" >
            {(expandedTab === 'dataset') && (
              taskToProcess.map((type) => (
                <div key={type.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <Accordion
                    key={type.id}
                    style={{ backgroundColor: 'white' }}
                    onChange={() => handleAccordionChange(type.id)}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ backgroundColor: 'white' }}>
                      <span style={{ marginRight: 10 }}> id:{type.id}/{type.name} </span>
                      <Button
                        size="small"
                        variant="contained"
                        color="inherit"
                        startIcon={<Refresh />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRefreshVitessce(type.id);
                        }}
                      >
                        Refresh Data
                      </Button>
                    </AccordionSummary>
                    <AccordionDetails style={{ backgroundColor: 'white' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', marginBottom: '10px', width: '100%' }}>
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

                          <Button
                            size="small"
                            variant="contained"
                            color="inherit"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveZarrData(type.id);
                            }}
                          >
                            write zarr
                          </Button>
                        </div>
                        <BottomNavigation
                          value={selectedTab}
                          onChange={handleTabChange}
                          showLabels
                        >
                          <BottomNavigationAction label="Rename clusters" icon={<LocationOnIcon />} />
                          <BottomNavigationAction label="Filter genes" icon={<FolderIcon />} />
                        </BottomNavigation>

                        {showSelectNew && (
                          <SelectNew
                            options={options}
                            value={selectedValues}
                            onChange={handleSelectedChannelsChange}
                            multiple
                          />
                        )}
                        {showSelectGrid && (
                          <Box sx={{ height: 400, width: 1000 }}>
                            <DataGrid
                              rows={rows}
                              columns={columns}
                              disableRowSelectionOnClick
                            />
                          </Box>
                        )}
                      </div>
                    </AccordionDetails>
                  </Accordion>

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
            <TabPanel key={type.id} value={expandedTab} index={type.id}>
              {
              (type.id === expandedTab) && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ marginRight: 10 }}>id:{type.id}/{type.name}

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
                    {showVitessce && (
                      <Vitessce
                        config={tasksVitessceConfigs[type.id]}
                        height={800}
                        theme="light"
                      />
                    )}
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

      {errorMessage ? <Message message={errorMessage} /> : null}

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
