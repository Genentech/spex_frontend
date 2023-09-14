import React, {
  Fragment, useState, useMemo, useCallback, useEffect,
} from 'react';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import DynamicFeedOutlinedIcon from '@material-ui/icons/DynamicFeedOutlined';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SaveIcon from '@material-ui/icons/Save';
import WallpaperIcon from '@material-ui/icons/Wallpaper';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import classNames from 'classnames';
import dagre from 'dagre';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import cloneDeep from 'lodash/cloneDeep';
import moment from 'moment';
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
import Table from '+components/Table';
import { Tab, Box } from '+components/Tabs';

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
  const images_results = useSelector(tasksSelectors.getTaskVisualizations || {});
  const tasksVitessceConfigs = useSelector(tasksSelectors.getTaskVitessceConfigs || {});
  const [taskToPanels, setTasksToPanels] = useState([]);
  const [currImages, setCurrImages] = useState({});
  const [selectedRows, setSelectedRows] = useState([]);
  const omeroWeb = useSelector(omeroSelectors.getOmeroWeb);
  // eslint-disable-next-line no-unused-vars
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const pipeline = useSelector(pipelineSelectors.getPipeline(projectId, pipelineId));

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


  const downloadPdf = useCallback(async () => {
    const doc = new jsPDF('p', 'px', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentYPos = 85;
    const yPosStep = 15;

    const addImageList = () => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const imageIds = project?.omeroIds || [];

      for (let i = 0; i < imageIds.length; i++) {
        const id = imageIds[i];
        doc.text(`Image ${i + 1} ID: ${id}`, 10, currentYPos);
        currentYPos += yPosStep;

        if (currentYPos + yPosStep > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          addHeader();
          currentYPos = 85;
        }
      }
    };

    const addEmptyLine = (doc, xPos, yPos) => {
      doc.text(' ', xPos, yPos);
      currentYPos += yPosStep;
    };

    const addHeader = () => {
      const reportTitle = 'SPEX Analysis Report';
      const date = moment().format('MMMM Do, YYYY');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(0, 0, 255);
      doc.text(reportTitle, 10, 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(date, pageWidth - 10, 15, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(15);
      doc.setTextColor(0, 0, 0);
      doc.text(`Name: ${project.name}`, 10, 35);
      doc.text(`Description: ${project.description}`, 10, 50);

      const authorText = `Author: ${project.author.login}`;
      const authorTextWidth = doc.getTextWidth(authorText);
      const authorX = pageWidth - 10 - authorTextWidth;
      doc.text(authorText, authorX, 50);

      doc.setDrawColor(0, 0, 255);
      doc.setLineWidth(0.5);
      doc.line(10, 60, pageWidth - 10, 60);

      addEmptyLine(doc, 10, currentYPos);

      if (doc.internal.getCurrentPageInfo().pageNumber === 1) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text(`Images – (Name of OMERO server, i.e. ${omeroWeb})`, 10, 75);
      }

      addEmptyLine(doc, 10, currentYPos);
    };

    const addPipelineInfo = () => {
      addEmptyLine(doc, 10, currentYPos);


      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text('Pipeline', 10, currentYPos);
      currentYPos += yPosStep;

      const pipelineName = pipelines[pipelineId]?.name;
      if (pipelineName) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(15);
        doc.text(pipelineName, 10, currentYPos);
        currentYPos += yPosStep;

        if (currentYPos + yPosStep > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          addHeader();
          currentYPos = 85;
        }
      }
    };

    function printTasks(data) {
      if (data.hasOwnProperty('name') && data.hasOwnProperty('params')) {
        doc.text('Task: ' + data.name, 10, currentYPos);
        currentYPos += yPosStep;
        doc.setFontSize(10);
        let filteredParams = Object.fromEntries(
          Object.entries(data.params)
            .filter(([key]) => key !== 'img'
              && key !== 'id'
              && key !== 'folder'
              && key !== 'script'
              && key !== 'part'
              && key !== 'omeroIds'),
        );
        let paramsString = 'Parameters: ' + JSON.stringify(filteredParams);
        let textLines = doc.splitTextToSize(paramsString, pageWidth - 20);
        for (let line of textLines) {
          doc.text(line, 10, currentYPos);
          currentYPos += yPosStep;
        }
        doc.setFontSize(12);

        if (currentYPos + yPosStep > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          addHeader();
          currentYPos = 85;
        }
      }

      if (data.hasOwnProperty('jobs')) {
        data.jobs.forEach(printTasks);
      }
      if (data.hasOwnProperty('tasks')) {
        data.tasks.forEach(printTasks);
      }
    }

    const addFlowDiagram = async () => {
      const input = document.getElementById('react-flow__pane_2');
      if (input) {
        try {
          const canvas = await html2canvas(input);
          const imgData = canvas.toDataURL('image/png');
          const imgProps = doc.getImageProperties(imgData);
          const pdfWidth = doc.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          doc.addImage(imgData, 'PNG', 0, currentYPos, pdfWidth, pdfHeight);
          currentYPos += pdfHeight + yPosStep;
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Oops, something went wrong!', err);
        }
      }
    };

    addHeader();
    addImageList();
    addPipelineInfo();
    await addFlowDiagram();
    addEmptyLine(doc, 10, currentYPos);


    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('Parameters', 10, currentYPos);
    currentYPos += yPosStep;
    printTasks(pipeline);



    doc.save('images.pdf');
  }, [project, omeroWeb, pipelineId, pipelines, pipeline]);


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

  useEffect(
    () => {
      if (selectedRows.length === 0) {
        setTasksToPanels([]);
      }
    },
    [selectedRows],
  );

  useEffect(
    () => {
      let imgToShow = {};
      const taskIds = taskToPanels.map((item) => {return item.id;});
      Object.keys(images_results).forEach((task_id) => {
        if (taskIds.includes(task_id)) {
          imgToShow[task_id] = images_results[task_id];
        }
      });
      setCurrImages(imgToShow);
    },
    [images_results, taskToPanels, setCurrImages],
  );

  const getTasks = useCallback(
    (ids, jobs, taskToPanels) => {
      if (Object.keys(pipelines).length !== 0) {
        let taskList = [];
        jobs.forEach(function (o) {
          if (ids.includes(o.id)) {
            taskList = [...taskList, ...o.tasks];
          }
        });

        if (taskToPanels !== taskList) {
          return taskList;
        }
        return taskList;
      }
    },
    [pipelines],
  );


  const onDataTabChange = useCallback(
    (_, id) => {
      const taskList = getTasks(selectedRows.map((object) => object.id), jobs_data, taskToPanels);
      setTasksToPanels(taskList);
      const taskIds = taskList.map((item) => {return item.id;});
      let imgToShow = {};
      Object.keys(images_results).forEach((task_id) => {
        if (taskIds.includes(task_id)) {
          imgToShow[task_id] = images_results[task_id];
        }
      });
      setCurrImages(imgToShow);
    },
    [taskToPanels, jobs_data, getTasks, images_results, selectedRows],
  );


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
      onDataTabChange('', tabs[0]);

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
    },
    [dispatch, taskToPanels],
  );

  return (
    <Fragment>
      <Table
        data={jobs_data}
        columns={columns}
        allowRowSelection
        onSelectedRowsChange={setSelectedRows}
        selectedRowIds={selectedRows.map((row) => row.id)}
      />
      <Box>
        {Object.values(tabsData).map((type) => (
          <Tab
            key={type}
            label={type}
            value={type}
          />
        ))}
      </Box>
      <Accordion expanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <DynamicFeedOutlinedIcon /> Tasks
        </AccordionSummary>
        <AccordionDetails>
          <TasksBlock>
            <List dense component="div">
              {taskToPanels.map((type) => (
                <Accordion key={type.id} style={{ backgroundColor: 'white' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    Task {type.id}, image id {type.omeroId}
                  </AccordionSummary>
                  <AccordionDetails>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ height: '100vh', width: '100vw' }}>
                        <Vitessce
                          config={tasksVitessceConfigs[type.id]}
                          height={800}
                          theme="light"
                        />
                      </div>
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
                  </AccordionDetails>
                </Accordion>

              ))}
            </List>
          </TasksBlock>
        </AccordionDetails>
      </Accordion>
      <Button
        size="small"
        variant="outlined"
        onClick={downloadPdf}
        startIcon={<SaveIcon />}
      >
        PDF
      </Button>
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
