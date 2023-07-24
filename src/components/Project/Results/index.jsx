import React, {
  Fragment, useState, useMemo, useCallback, useEffect,
} from 'react';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import DynamicFeedOutlinedIcon from '@material-ui/icons/DynamicFeedOutlined';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SaveIcon from '@material-ui/icons/Save';
import WallpaperIcon from '@material-ui/icons/Wallpaper';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import { jsPDF } from 'jspdf';
import moment from 'moment';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { matchPath, useLocation } from 'react-router-dom';

import PathNames from '@/models/PathNames';

import { actions as jobsActions, selectors as jobsSelectors } from '@/redux/modules/jobs';
import { actions as omeroActions, selectors as omeroSelectors } from '@/redux/modules/omero';
import { actions as pipelineActions, selectors as pipelineSelectors } from '@/redux/modules/pipelines';
import { selectors as projectSelectors } from '@/redux/modules/projects';
import { actions as tasksActions, selectors as tasksSelectors } from '@/redux/modules/tasks';

import Button from '+components/Button';
import Table from '+components/Table';
import { Tab, Box } from '+components/Tabs';

const refreshInterval = 6e4; // 1 minute

const Results = ( { sidebarWidth } ) => {
  const dispatch = useDispatch();
  const location = useLocation();

  const matchProjectPath = matchPath(location.pathname, { path: `/${PathNames.projects}/:id` });
  const projectId = matchProjectPath ? matchProjectPath.params.id : undefined;
  const project = useSelector(projectSelectors.getProject(projectId));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pipelines = useSelector(pipelineSelectors.getPipelinesWithTasksForVis(projectId)) || {};
  const matchPipelinePath = matchPath(location.pathname, {
    path: `/${PathNames.projects}/${projectId}/${PathNames.processes}/:id`,
  });
  const pipelineId = matchPipelinePath ? matchPipelinePath.params.id : undefined;
  const images_results = useSelector(tasksSelectors.getTaskVisualizations || {});
  const jobTypes = useSelector(jobsSelectors.getJobTypes);
  const [taskToPanels, setTasksToPanels] = useState([]);
  const [currImages, setCurrImages] = useState({});
  const [refresher, setRefresher] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const omeroWeb = useSelector(omeroSelectors.getOmeroWeb);

  const jobs_data = useMemo(
    () => {
      if (pipelines.length === 0 || Object.keys(pipelines).length === 0) {
        return [];
      }
      if (pipelines[pipelineId]) {
        return pipelines[pipelineId]['jobs'];
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
      taskToPanels.forEach((item) => {
        dispatch(tasksActions.fetchTaskVisualize({
          id: item.id,
          name: item.name,
          script: item.params?.script,
          channels: item.params?.channels,
          key: nameReturnKey[item.name],
        }));
      });
    },
    [dispatch, taskToPanels, nameReturnKey],
  );

  const downloadPdf = useCallback(() => {
    const doc = new jsPDF('p', 'px', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const imageWidth = pageWidth - 20;
    let currentYPos = 85; // Defined at the level of the downloadPdf function
    const yPosStep = 15; // Vertical position increment for each subsequent ID

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

    addHeader();
    addImageList();
    let y = 80;

    console.log(project);

    // for (const task of taskToPanels) {
    //   doc.setFontSize(10);
    //   doc.text(`Task: ${task.name} ${task.id}`, 10, y);
    //
    //   for (const key in currImages[task.id]) {
    //     const base64Image = currImages[task.id][key];
    //     const image = base64Image.replace('data:image/png;base64,', '');
    //
    //     const img = new Image();
    //     img.src = base64Image;
    //     const imgWidth = img.width;
    //     const imgHeight = img.height;
    //     const aspectRatio = imgWidth / imgHeight;
    //
    //     const finalImageHeight = imageWidth / aspectRatio;
    //     if (y + finalImageHeight + 20 > doc.internal.pageSize.getHeight() - 20) {
    //       doc.addPage();
    //       addHeader();
    //       y = 80;
    //     }
    //
    //     doc.addImage(image, 'PNG', 10, y + 10, imageWidth, finalImageHeight);
    //     y += finalImageHeight + 20;
    //   }
    // }

    doc.save('images.pdf');
  }, [taskToPanels, currImages, project, omeroWeb]);


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
      dispatch(pipelineActions.fetchPipelinesForVis(projectId));
    },
    [dispatch, projectId, pipelineId, refresher],
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
      const intervalId = setInterval(() => {
        setRefresher(Date.now());
      }, refreshInterval);
      return () => {
        clearInterval(intervalId);
      };
    },
    [dispatch],
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
      dispatch(jobsActions.fetchJobTypes());
      return () => {
        dispatch(jobsActions.clearJobTypes());
      };
    },
    [dispatch],
  );

  return (
    <Fragment>
      <Table
        data={jobs_data}
        columns={columns}
        allowRowSelection
        onSelectedRowsChange={setSelectedRows}
        selectedRowIds={selectedRows.map((row) => row.id)}
        // initialSelectedRowIds={project?.file_names}
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
          <List dense component="div">
            {taskToPanels.map((type) => (
              <ListItem component="div" key={type.id}>
                <ListItemText
                  primary={`task id: ${type.id}.`}
                />
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
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
      <Button
        size="small"
        variant="outlined"
        onClick={onLoadVisualize}
        startIcon={<WallpaperIcon />}
      >
        Render value
      </Button>
      <Button
        size="small"
        variant="outlined"
        onClick={downloadPdf}
        startIcon={<SaveIcon />}
      >
        PDF
      </Button>
    </Fragment>
  );
};

Results.propTypes = {
  // eslint-disable-next-line react/require-default-props
  sidebarWidth: PropTypes.number,
};

export default Results;
