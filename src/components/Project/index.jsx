import React, { useState, useCallback, useEffect } from 'react';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import { makeStyles } from '@material-ui/core/styles';
import DoubleArrowIcon from '@material-ui/icons/DoubleArrow';
import ResultsIcon from'@mui/icons-material/ManageHistory';
import SettingsIcon from '@mui/icons-material/Settings';
import classNames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { matchPath, useHistory, useLocation } from 'react-router-dom';
import List, { ListItem, ListItemIcon, ListItemText } from '+components/List';
import { getFromStorage, saveToStorage } from '+utils/localStorage';
import PathNames from '@/models/PathNames';
import { actions as processActions, selectors as processSelectors } from '@/redux/modules/processes';

import ProjectIcon from '@/shared/components/Icons/ProjectIcon';
import WorkFlowIcon from '@/shared/components/Icons/WorkFlowIcon';


import Container from './components/Container';
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
  const history = useHistory();
  const [currentUrl, setCurrentUrl] = useState(window.location.pathname);

  const location = useLocation();

  useEffect(() => {
    setCurrentUrl(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const isSidebarOpened = getFromStorage('sidebarOpened') === 'true';
    setSidebarOpened(isSidebarOpened);
    const newSidebarWidth = isSidebarOpened ? drawerWidth : drawerWidthClosed;
    setSidebarWidth(newSidebarWidth);
  }, []);


  const dispatch = useDispatch();
  const selectedOption = useSelector(processSelectors.getSelectedOption);

  const handleSettingsClick = () => {
    dispatch(processActions.setSelectedOption('settings'));
  };

  const handleStatusClick = () => {
    dispatch(processActions.setSelectedOption('status'));
  };

  const classes = useStyles();

  const matchProjectPath = matchPath(location.pathname, { path: `/${PathNames.projects}/:id` });
  const projectId = matchProjectPath ? matchProjectPath.params.id : undefined;

  const pathMatchOptionsWithoutTab = { path: `/${PathNames.projects}/${projectId}/${PathNames.processes}/:id` };
  const pathMatchOptionsWithTab = { path: `/${PathNames.projects}/${projectId}/${PathNames.processes}/:id/:tabName` };
  const matchWithoutTab = matchPath(location.pathname, pathMatchOptionsWithoutTab);
  const matchWithTab = matchPath(location.pathname, pathMatchOptionsWithTab);
  const processId = matchWithoutTab ? matchWithoutTab.params.id : undefined;
  const processTabName = matchWithTab ? matchWithTab.params.tabName : undefined;
  const ShowProcess = !!matchPath(location.pathname, { path: [pathMatchOptionsWithoutTab.path, pathMatchOptionsWithTab.path], exact: true });

  const pathMatchOptionsWithReviewTab = { path: `/${PathNames.projects}/${projectId}/${PathNames.processes}/:id/review/:tabReview` };
  const matchWithReviewTab = matchPath(location.pathname, pathMatchOptionsWithReviewTab);
  const processReviewTabName = matchWithReviewTab ? matchWithReviewTab.params.tabReview : undefined;
  const ShowProcessReviewTab = !!matchPath(location.pathname, { path: pathMatchOptionsWithReviewTab.path, exact: true });

  const resourcesUrl = `/${PathNames.projects}/${projectId}`;
  const resultsUrl = `/${PathNames.projects}/${projectId}/${PathNames.results}`;
  const processesUrl = `/${PathNames.projects}/${projectId}/${PathNames.processes}`;

  const showResources = !!matchPath(location.pathname, { path: resourcesUrl, exact: true });
  const ShowProcesses = !!matchPath(location.pathname, { path: processesUrl, exact: true });
  const showResults = !!matchPath(location.pathname, { path: resultsUrl });

  const [sidebarOpened, setSidebarOpened] = useState(getFromStorage('sidebarOpened') === 'true');
  const [sidebarWidth, setSidebarWidth] = useState(drawerWidthClosed);

  const onSidebarItemClick = useCallback(
    (url) => () => {
      history.push(url);
    },
    [history],
  );

  const onSidebarToggle = useCallback(() => {
    setSidebarOpened((prevValue) => {
      const newSidebarOpened = !prevValue;
      saveToStorage('sidebarOpened', newSidebarOpened);
      const newSidebarWidth = newSidebarOpened ? drawerWidth : drawerWidthClosed;
      setSidebarWidth(newSidebarWidth);
      return newSidebarOpened;
    });
  }, []);


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
            // disabled={isProcessOpen}
          >
            <ListItemIcon><DoubleArrowIcon
              className={classNames({ [classes.arrowIconOpen]: sidebarOpened })}
                          />
            </ListItemIcon>

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
            selected={ShowProcesses || ShowProcess || ShowProcessReviewTab}
            onClick={onSidebarItemClick(processesUrl)}
            button
          >
            <ListItemIcon><WorkFlowIcon fontSize="large" /></ListItemIcon>

            <ListItemText primary="Analysis" />
          </ListItem>

          <Divider className={classes.divider} style={{ marginTop: '140px' }} />

          <ListItem
            className={classes.listItem} // Применяем стили элемента списка
            selected={selectedOption === 'settings'}
            onClick={handleSettingsClick}
            button// Отображаем как кнопку
            style={{ display: currentUrl.includes('/processes/') && currentUrl.includes('/build') ? 'block' : 'none' }}
          >
            <ListItemIcon><SettingsIcon fontSize="medium" />

              <ListItemText
                primary="Settings"
                style={{ marginLeft: '25px' }} // Добавляем отступ слева от текста
              />
            </ListItemIcon>
          </ListItem>

          <ListItem
            className={classes.listItem}
            selected={selectedOption === 'status'}
            onClick={handleStatusClick}
            button
            style={{ display: currentUrl.includes('/processes/') && currentUrl.includes('/build') ? 'block' : 'none' }}
          >
            <ListItemIcon><ResultsIcon fontSize="medium" />

              <ListItemText
                primary="Status"
                style={{ marginLeft: '25px' }}
              />
            </ListItemIcon>
          </ListItem>
        </List>
      </Drawer>

      {showResources ? <Resources /> : null}

      {ShowProcesses ? <Processes /> : null}

      {(ShowProcess || ShowProcessReviewTab) ? <TabContainer
        sidebarWidth={sidebarWidth}
        activeTab={processTabName}
        projectId={projectId}
        processId={processId}
        processReviewTabName={processReviewTabName}
                                               /> : null}

      {showResults ? <Results /> : null}
    </Container>
  );
};

export default Project;
