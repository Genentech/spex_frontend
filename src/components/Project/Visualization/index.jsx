import React, {
  Fragment, useRef, useState, useMemo, useCallback, useEffect,
} from 'react';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import DynamicFeedOutlinedIcon from '@material-ui/icons/DynamicFeedOutlined';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import WallpaperIcon from '@material-ui/icons/Wallpaper';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import { useDispatch, useSelector } from 'react-redux';
import { matchPath, useLocation } from 'react-router-dom';


import PathNames from '@/models/PathNames';
import { actions as pipelineActions, selectors as pipelineSelectors } from '@/redux/modules/pipelines';

import { actions as tasksActions, selectors as tasksSelectors } from '@/redux/modules/tasks';
import Button from '+components/Button';
import Link from '+components/Link';
import Table from '+components/Table';
import Tabs, { Tab, Box } from '+components/Tabs';
import SubComponent from './components/SubComponent';


const refreshInterval = 6e4; // 1 minute

const Visualization = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const matchProjectPath = matchPath(location.pathname, { path: `/${PathNames.projects}/:id` });
  const projectId = matchProjectPath ? matchProjectPath.params.id : undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pipelines = useSelector(pipelineSelectors.getPipelinesWithTasksForVis(projectId)) || {};
  const images_visualization = useSelector(tasksSelectors.getTaskVisualizations || {});
  const [taskToPanels, setTasksToPanels] = useState([]);
  const [currImages, setCurrImages] = useState({});
  const [refresher, setRefresher] = useState(null);
  const selectedRef = useRef({});
  const [selectedRows, setSelectedRows] = useState([]);
  const [activeDataTab, setActiveDataTab] = useState('');

  const onLoadVisualize = useCallback(
    () => {
      taskToPanels.forEach((item) => {
        dispatch(tasksActions.fetchTaskVisualize({ id: item.id, name: item.name }));
      });
    },
    [dispatch, taskToPanels],
  );


  const pipelineData = useMemo(
    () => {
      if (pipelines.length === 0 || Object.keys(pipelines).length === 0) {
        return [];
      }
      return Object.values(pipelines);
    },

    [pipelines],
  );

  const onSelectedRowsChange = useCallback(
    (selected, parent) => {
      selectedRef.current[parent.id] = selected.map(({ id }) => id);
      const selected2 = Object.values(selectedRef.current).flat();
      setSelectedRows(selected2);
    },
    [],
  );

  const columns = useMemo(
    () => ([{
      accessor: 'id',
      Header: 'id',
      getCellProps: () => ({ style: { textTransform: 'capitalize' } }),
      Cell: ({ row: { original: { id } } }) => useMemo(
        () => (
          <Link
            to={`/${PathNames.projects}/${projectId}/${PathNames.pipelines}/${id}`}
            underline="always"
          >
            {id}
          </Link>
        ),
        [id],
      ),
      minWidth: 50,
      maxWidth: 50,
    }, {
      accessor: 'name',
      Header: 'name',
      getCellProps: () => ({ style: { textTransform: 'capitalize' } }),
      Cell: ({ row: { original: { name, id } } }) => useMemo(
        () => (
          <Link
            to={`/${PathNames.projects}/${projectId}/${PathNames.pipelines}/${id}`}
            underline="always"
          >
            {name}
          </Link>
        ),
        [id, name],
      ),
    }]),
    [projectId],
  );

  useEffect(
    () => {
      if (!projectId) {
        return;
      }
      dispatch(pipelineActions.fetchPipelinesForVis(projectId));
    },
    [dispatch, projectId, refresher],
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
      Object.keys(images_visualization).forEach((task_id) => {
        if (taskIds.includes(task_id)) {
          imgToShow[task_id] = images_visualization[task_id];
        }
      });
      setCurrImages(imgToShow);
    },
    [images_visualization, taskToPanels, setCurrImages],
  );

  const getTasks = useCallback(
    (id, pipelines, taskToPanels) => {
      if (Object.keys(pipelines).length !== 0) {
        let taskList = [];
        pipelines.forEach(function (o) {
          o.jobs.forEach(function (job) {
            if ([id].includes(job.id) === true) {
              taskList = [...taskList, ...job.tasks];
            }
          });
        });

        if (taskToPanels !== taskList) {
          return taskList;
        }
        return taskList;
      }
    },
    [],
  );


  const onDataTabChange = useCallback(
    (_, id) => {
      setActiveDataTab(id);
      const taskList = getTasks(id, pipelineData, taskToPanels);
      setTasksToPanels(taskList);
      const taskIds = taskList.map((item) => {return item.id;});
      let imgToShow = {};
      Object.keys(images_visualization).forEach((task_id) => {
        if (taskIds.includes(task_id)) {
          imgToShow[task_id] = images_visualization[task_id];
        }
      });
      setCurrImages(imgToShow);
    },
    [taskToPanels, pipelineData, getTasks, images_visualization],
  );


  const tabsData = useMemo(
    () => {
      if (pipelineData.length === 0 || selectedRows.length === 0) {
        return [];
      }
      let tabs = [];
      let pipelines_job_ids = [];
      pipelineData.forEach((pipeline) => {
        pipeline.jobs.forEach((job) => {
          pipelines_job_ids.push(job.id);
        });
      });

      tabs = selectedRows.filter(((n) => pipelines_job_ids.includes(n)));
      onDataTabChange('', tabs[0]);

      return tabs;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedRows, pipelineData],
  );

  const WithSelected = useCallback(
    (subProps) => {
      return (
        <SubComponent
          {...subProps}
          onSelectedRowsChange={(selected) => onSelectedRowsChange(selected, subProps)}
        />
      );
    },
    [onSelectedRowsChange],
  );

  return (
    <Fragment>

      <Table
        onSelectedRowsChange={setSelectedRows}
        columns={columns}
        data={pipelineData}
        SubComponent={WithSelected}
      />
      <Box>
        <Tabs
          value={activeDataTab}
          onChange={onDataTabChange}
        >
          {Object.values(tabsData).map((type) => (
            <Tab
              key={type}
              label={type}
              value={type}
            />
          ))}
        </Tabs>
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
    </Fragment>
  );
};

export default Visualization;
