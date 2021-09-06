import React, { useState, useCallback } from 'react';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import { makeStyles } from '@material-ui/core/styles';
import AppsIcon from '@material-ui/icons/Apps';
import DoubleArrowIcon from '@material-ui/icons/DoubleArrow';
import FolderIcon from '@material-ui/icons/Folder';
import VisibilityIcon from '@material-ui/icons/Visibility';
import classNames from 'classnames';
import { matchPath, useHistory, useLocation } from 'react-router-dom';

import PathNames from '@/models/PathNames';

import List, { ListItem, ListItemIcon, ListItemText } from '+components/List';
import { getFromStorage, saveToStorage } from '+utils/localStorage';

import Container from './components/Container';
import Pipelines from './Pipelines';
import Resources from './Resources';
import Visualization from './Visualization';

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

  const resourcesUrl = `/${PathNames.projects}/${projectId}`;
  const pipelinesUrl = `/${PathNames.projects}/${projectId}/pipelines`;
  const visualizationUrl = `/${PathNames.projects}/${projectId}/visualization`;

  const showResources = !!matchPath(location.pathname, { path: resourcesUrl, exact: true });
  const showPipelines = !!matchPath(location.pathname, { path: pipelinesUrl });
  const showVisualization = !!matchPath(location.pathname, { path: visualizationUrl });

  const [sidebarOpened, setSidebarOpened] = useState(getFromStorage('sidebarOpened') === 'true');

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
            <ListItemIcon><FolderIcon /></ListItemIcon>
            <ListItemText primary="Resources" />
          </ListItem>

          <ListItem
            className={classes.listItem}
            selected={showPipelines}
            onClick={onSidebarItemClick(pipelinesUrl)}
            button
          >
            <ListItemIcon><AppsIcon /></ListItemIcon>
            <ListItemText primary="Build Analysis" />
          </ListItem>

          <ListItem
            className={classes.listItem}
            selected={showVisualization}
            onClick={onSidebarItemClick(visualizationUrl)}
            button
          >
            <ListItemIcon><VisibilityIcon /></ListItemIcon>
            <ListItemText primary="Visualization" />
          </ListItem>
        </List>
      </Drawer>

      {showResources && <Resources />}
      {showPipelines && <Pipelines />}
      {showVisualization && <Visualization />}
    </Container>
  );
};

export default Project;
