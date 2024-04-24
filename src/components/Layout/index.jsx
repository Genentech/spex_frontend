import React, { useCallback, useEffect, useState } from 'react';
import AppBar from '@material-ui/core/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import { makeStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation, matchPath } from 'react-router-dom';



import Button, { ButtonColors } from '+components/Button';
import Link from '+components/Link';
import Progress from '+components/Progress';
import Select, { Option } from '+components/Select';
import Typography from '+components/Typography';
import PathNames from '@/models/PathNames';
import { actions as processesActions, selectors as processesSelectors } from '@/redux/modules/processes';
import { actions as projectsActions, selectors as projectsSelectors } from '@/redux/modules/projects';
import { actions as authActions } from '@/redux/modules/users/auth';

import Body from './components/Body';
import Container from './components/Container';
import spex_banner from './components/spex_logo_small.svg';

const none = 'none';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    width: '100%',
    position: 'relative',
    height: '100%',
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
  },
  body: {
    flexGrow: 1,
    marginTop: '64px',
    padding: theme.spacing(3),
    height: 'calc(100% - 64px)',
    overflowX: 'hidden',
    overflowY: 'scroll',
  },
  projectSelect: {
    width: '300px !important',
    marginLeft: '20px',
    color: 'white',
  },
  logoutButton: {
    marginLeft: 'auto',
  },
}));

const Layout = ({ children }) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();

  const [selectedProjectId, setSelectedProjectId] = useState(none);
  const [selectedProcessId, setSelectedProcessId] = useState(none);

  const matchProjectPath = matchPath(location.pathname, { path: `/${PathNames.projects}/:id` });
  const projectId = matchProjectPath ? matchProjectPath.params.id : none;

  const projects = useSelector(projectsSelectors.getProjects);
  const projectsArr = Object.values(projects);
  const isProjectsFetching = useSelector(projectsSelectors.isFetching);

  const processes = useSelector(processesSelectors.getProcessesOfProject(projectId));
  const processesArr = Object.values(processes);
  const isProcessesFetching = useSelector(processesSelectors.isFetching);

  const onProjectChange = useCallback(
    (event) => {
      const { target: { value: id } } = event;
      setSelectedProcessId(none);
      const url = `/${PathNames.projects}${id === none ? '' : `/${id}`}`;
      history.push(url);
    },
    [history],
  );

  const onProcessChange = useCallback(
    (event) => {
      const { target: { value: id } } = event;
      setSelectedProcessId(id);
      if (id === none) {
        history.push(`/${PathNames.projects}/${projectId}/${PathNames.processes}`);
      } else {
        const url = `/${PathNames.projects}/${projectId}/${PathNames.processes}/${id}`;
        history.push(url);
      }
    },
    [history, projectId],
  );

  const onLogout = useCallback(
    () => {
      dispatch(authActions.logout());
    },
    [dispatch],
  );

  useEffect(
    () => {
      dispatch(projectsActions.fetchProjects());
      return () => {
        dispatch(projectsActions.clearProjects());
      };
    },
    [dispatch],
  );

  useEffect(
    () => {
      if (selectedProjectId !== none) {
        dispatch(processesActions.fetchProcessesOfProject(selectedProjectId));
      }
    },
    [selectedProjectId, dispatch],
  );

  useEffect(() => {
    const match = matchPath(location.pathname, { path: `/${PathNames.projects}/:id` });
    const projectIdFromUrl = match ? match.params.id : none;
    setSelectedProjectId(projectIdFromUrl);
    const processIdFromUrl = matchPath(location.pathname, { path: `/${PathNames.projects}/:projectId/${PathNames.processes}/:processId` });
    if (processIdFromUrl) {
      const { params: { projectId, processId } } = processIdFromUrl;
      setSelectedProjectId(projectId);
      setSelectedProcessId(processId);
    }
    const matchProject = matchPath(location.pathname, { path: `/${PathNames.projects}/:projectId` });
    const matchProcess = matchPath(location.pathname, { path: `/${PathNames.projects}/:projectId/${PathNames.processes}` });

    if (matchProject && !matchProcess) {
      setSelectedProcessId(none);
    }
  }, [location.pathname]);

  return (
    <Container className={classes.root}>
      <CssBaseline />

      <Progress />

      <AppBar
        position="fixed"
        className={classes.appBar}
      >
        <Toolbar>
          <Typography variant="h6">
            <Link to="/">
              <img
                src={spex_banner}
                alt='spex_logo'
                style={{ width: 150, marginRight: '44px', maxHeight: '80%', objectFit: 'contain' }}
              />
            </Link>
          </Typography>

          {projectsArr.length > 0 && !isProjectsFetching && !isProcessesFetching && !isProcessesFetching && (
            <Select
              className={classes.projectSelect}
              defaultValue={none}
              value={selectedProjectId}
              onChange={onProjectChange}
              disabled={isProcessesFetching}
            >
              <Option value={none}>Select Project</Option>

              {projectsArr.map((item) => (<Option key={item.id} value={item.id}>{item.name}</Option>))}
            </Select>
          )}

          {processesArr.length > 0 && !isProcessesFetching && (
            <Select
              className={classes.projectSelect}
              defaultValue={none}
              value={selectedProcessId}
              onChange={onProcessChange}
              disabled={selectedProjectId === none}
            >
              <Option value={none}>Select Process</Option>

              {processesArr.map((item) => (<Option key={item.id} value={item.id}>{item.name}</Option>))}
            </Select>
          )}


          <Button
            className={classes.logoutButton}
            variant="outlined"
            color={ButtonColors.secondary}
            onClick={onLogout}
          >
            Log Out
          </Button>
        </Toolbar>
      </AppBar>

      <Body className={classes.body}>
        {children}
      </Body>
    </Container>
  );
};

Layout.propTypes = {
  children: PropTypes.oneOfType([ PropTypes.node, PropTypes.object, PropTypes.func ]),
};

Layout.defaultProps = {
  children: null,
};

export default Layout;
