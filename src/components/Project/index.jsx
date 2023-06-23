import React, { useState, useCallback } from 'react';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import { makeStyles } from '@material-ui/core/styles';
import DoubleArrowIcon from '@material-ui/icons/DoubleArrow';
import classNames from 'classnames';
import { matchPath, useHistory, useLocation } from 'react-router-dom';

import PathNames from '@/models/PathNames';
// import DashboardICon from '@/shared/components/Icons/DashboardIcon';
import ProjectIcon from '@/shared/components/Icons/ProjectIcon';
import WorkFlowIcon from '@/shared/components/Icons/WorkFlowIcon';

import List, { ListItem, ListItemIcon, ListItemText } from '+components/List';
import { getFromStorage, saveToStorage } from '+utils/localStorage';

import Container from './components/Container';
import Pipeline from './Pipeline';
import Pipelines from './Pipelines';
import Processes from './Processes';
import Resources from './Resources';
import Results from './Results';
import TabContainer from './TabComponent';

const drawerWidth = 240;
const drawerWidthClosed = 72;

const useStyles = makeStyles((theme) => ({
  drawer: {
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  drawerOpen: {
    top: '64px',
    width: drawerWidth,
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerClose: {
    top: '64px',
    width: drawerWidthClosed,
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  body: {
    marginLeft: drawerWidthClosed,
    transition: theme.transitions.create(['margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  bodyShift: {
    marginLeft: drawerWidth,
    transition: theme.transitions.create(['margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  listItem: {
    paddingLeft: '24px',
  },
  divider: {
    margin: '12px 0',
  },
  arrowIconOpen: {
    transform: 'rotate(180deg)',
  },
}));

const Project = () => {
  const classes = useStyles();

  const history = useHistory();
  const location = useLocation();

  const matchProjectPath = matchPath(location.pathname, { path: `/${PathNames.projects}/:id` });
  const projectId = matchProjectPath ? matchProjectPath.params.id : undefined;

  const mathcProcessPath = matchPath(location.pathname, { path: `/${PathNames.projects}/${projectId}/${PathNames.processes}/:id` });
  const processId = mathcProcessPath ? mathcProcessPath.params.id : undefined;
  const mathcPipelinePath = matchPath(location.pathname, { path: `/${PathNames.projects}/${projectId}/${PathNames.pipelines}/:id` });
  const pipelineId = mathcPipelinePath ? mathcPipelinePath.params.id : undefined;

  const resourcesUrl = `/${PathNames.projects}/${projectId}`;
  const resultsUrl = `/${PathNames.projects}/${projectId}/${PathNames.results}`;
  const processesUrl = `/${PathNames.projects}/${projectId}/${PathNames.processes}`;
  const processesPipelineUrl = `/${PathNames.projects}/${projectId}/${PathNames.processes}/${processId}`;
  const pipelinesUrl = `/${PathNames.projects}/${projectId}/${PathNames.pipelines}`;
  const pipelineUrl = `/${PathNames.projects}/${projectId}/${PathNames.pipelines}/${pipelineId}`;

  const showResources = !!matchPath(location.pathname, { path: resourcesUrl, exact: true });
  const ShowProcesses = !!matchPath(location.pathname, { path: processesUrl, exact: true });
  const ShowProcess = !!matchPath(location.pathname, { path: processesPipelineUrl, exact: true });
  const ShowPipelines = !!matchPath(location.pathname, { path: pipelinesUrl, exact: true });
  const ShowPipeline = !!matchPath(location.pathname, { path: pipelineUrl, exact: true });
  const showResults = !!matchPath(location.pathname, { path: resultsUrl });

  const [sidebarOpened, setSidebarOpened] = useState(getFromStorage('sidebarOpened') === 'true');
  const [sidebarWidth, setSidebarWidth] = useState(drawerWidthClosed);

  const onSidebarItemClick = useCallback(
    (url) => () => {
      history.push(url);
    },
    [history],
  );

  const onSidebarToggle = useCallback(
    () => {
      setSidebarOpened((prevValue) => {
        saveToStorage('sidebarOpened', !prevValue);
        const newSidebarWidth = prevValue ? drawerWidthClosed : drawerWidth;
        setSidebarWidth(newSidebarWidth);
        return !prevValue;
      });
    },
    [],
  );

  return (
    <Container
      className={classNames(classes.body, {
        [classes.bodyShift]: sidebarOpened,
      })}
      sidebarWidth={sidebarWidth}
    >
      <Drawer
        variant="permanent"
        className={classNames(classes.drawer, {
          [classes.drawerOpen]: sidebarOpened,
          [classes.drawerClose]: !sidebarOpened,
        })}
        classes={{
          paper: classNames({
            [classes.drawerOpen]: sidebarOpened,
            [classes.drawerClose]: !sidebarOpened,
          }),
        }}
      >
        <List>
          <ListItem
            className={classes.listItem}
            onClick={onSidebarToggle}
            button
          >
            <ListItemIcon><DoubleArrowIcon className={classNames({ [classes.arrowIconOpen]: sidebarOpened })} /></ListItemIcon>
            <ListItemText primary="Collapse" />
          </ListItem>

          <Divider className={classes.divider} />

          <ListItem
            className={classes.listItem}
            selected={showResources}
            onClick={onSidebarItemClick(resourcesUrl)}
            button
          >
            <ListItemIcon><ProjectIcon fontSize="large" /></ListItemIcon>
            <ListItemText primary="Resources" />
          </ListItem>

          <ListItem
            className={classes.listItem}
            selected={ShowProcesses || ShowProcess}
            onClick={onSidebarItemClick(processesUrl)}
            button
          >
            <ListItemIcon><WorkFlowIcon fontSize="large" /></ListItemIcon>
            <ListItemText primary="Analysis" />
          </ListItem>

        </List>
      </Drawer>

      {showResources && <Resources />}
      {ShowProcesses && <Processes />}
      {ShowProcess && <TabContainer sidebarWidth={sidebarWidth} />}
      {ShowPipelines && <Pipelines />}
      {ShowPipeline && <Pipeline />}
      {showResults && <Results />}
    </Container>
  );
};

export default Project;
