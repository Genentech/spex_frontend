import React, { useCallback, useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core';
import AssignmentIcon from '@material-ui/icons/Assignment';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import ErrorIcon from '@material-ui/icons/Error';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import TaskInfoModal from '@/components/Project/Process/components/TaskInfoModal';
import { actions as jobsActions, selectors as jobsSelectors } from '@/redux/modules/jobs';
import { statusFormatter } from '+utils/statusFormatter';


const StyledAccordionDetails = styled(AccordionDetails)`
    width: 100%;
`;

const FullWidthList = styled(List)`
    width: 100%;
`;

const ScrollableTasksContainer = styled.div`
    max-height: ${(props) => props.height};
    overflow-y: auto;
`;

const TasksDisplay = ({ jobs }) => {
  const dispatch = useDispatch();
  const [containerHeight, setContainerHeight] = useState('600px');
  const jobData = useSelector(jobsSelectors.getJobData);
  const [showModalInfo, setShowModalInfo] = useState(false);
  const [contentModalInfo, setContentModalInfo ] = useState({ header: null, infoText: null });
  const [activeJobId, setActiveJobId] = useState(null);


  const updateHeight = () => {
    setContainerHeight(`${window.innerHeight * 0.8}px`);
  };

  useEffect(() => {
      window.addEventListener('resize', updateHeight);
      updateHeight();

      return () => {
        window.removeEventListener('resize', updateHeight);
      };
    },
    []);


  const jobsByStatus = {};
  Object.values(jobs).forEach((job) => {
    if (!jobsByStatus[job.status]) jobsByStatus[job.status] = [];
    jobsByStatus[job.status].push(job);
  });


  const onDownload = useCallback(
    async (job_id) => {
      const fileName = `job_${job_id}.zip`;
      dispatch(jobsActions.downloadJob({ jobId: job_id, fileName }));
    },
    [dispatch],
  );

  const handleClose = () => {
    setShowModalInfo(false);
    setContentModalInfo ({ header: null, infoText: null });
    setActiveJobId(null);
  };

  const fetchData = useCallback (() => {
    if (activeJobId && !jobData[activeJobId]) {
      dispatch(jobsActions.fetchJobData(activeJobId));
    }
  },[jobData, activeJobId, dispatch]);

  useEffect( () => {
    if (activeJobId) {
      fetchData();
    }
      if(activeJobId && jobData[activeJobId]) {
        const header = `Job : ${jobs[activeJobId].name}. Status: ${statusFormatter(jobs[activeJobId].status)}`;
        const infoText = <pre>{JSON.stringify(jobData[activeJobId], null, 2)}</pre>;
        setContentModalInfo({ header , infoText });
      }
  }, [fetchData, activeJobId, dispatch, jobData, jobs]);
  const openModalInfoFeatureExtraction =(job) => {
    setActiveJobId(job.id);
    setShowModalInfo(true);
  };

  const openModalInfoTaskError = (taskError) => {
    const header = 'Task Error';
    const infoText = taskError;
    setContentModalInfo({ header , infoText });
    setShowModalInfo(true);
  };

  return (
    <ScrollableTasksContainer height={containerHeight}>
      <React.Fragment>
        {contentModalInfo.header && contentModalInfo.infoText && showModalInfo ? <TaskInfoModal
          header={contentModalInfo.header}
          infoText={contentModalInfo.infoText}
          open={showModalInfo}
          onClose={handleClose}
                                                                                 /> : null}

        {Object.entries(jobsByStatus).map(([status, jobs]) => (
          <Accordion key={status}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <ListItemText
                primary={`Status: ${statusFormatter(status)}`}
              />
            </AccordionSummary>

            <StyledAccordionDetails>
              <FullWidthList component="div">
                {jobs ? jobs.map((job, i) => (
                  <Accordion key={job.id}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <ListItemText
                        primary={`Job ${i + 1}: ${job.name}`}
                        secondary={`Status: ${statusFormatter(job.status)}`}
                      />

                      {job.name === 'feature_extraction' && (
                        <div>
                          <Button
                            size="small"
                            variant="contained"
                            color="inherit"
                            startIcon={<AssignmentIcon />}
                            onClick={() => openModalInfoFeatureExtraction(job)}
                          >
                            Info
                          </Button>

                          <span style={{ marginRight: 10 }} />

                          <Button
                            size="small"
                            variant="contained"
                            color="inherit"
                            startIcon={<DownloadIcon />}
                            onClick={() => onDownload(job.id)}
                          >
                            zarr
                          </Button>
                        </div>
                      )}
                    </AccordionSummary>

                    <StyledAccordionDetails>
                      <FullWidthList component="div">
                        {job ? job.tasks?.map((task, j) => (
                          <Accordion key={task.id}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <ListItemText primary={`Task ${j + 1}: ${task.name}`} />
                            </AccordionSummary>

                            <StyledAccordionDetails>
                              <FullWidthList>
                                <ListItem style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <ListItemText
                                    primary={`Task ID: ${task.id}, image id: ${task.omeroId} Status: ${statusFormatter(task.status)}`}
                                  />

                                  {task.error ? <Button
                                    size="small"
                                    variant="contained"
                                    color="secondary"
                                    startIcon={<ErrorIcon />}
                                    onClick={() => openModalInfoTaskError(task.error)}
                                                >
                                    Info
                                  </Button> : null}
                                </ListItem>

                                <ListItem>
                                  {task.status === 'pending' && <CircularProgress />}

                                  {task.status === 'error' && <ErrorIcon color="secondary" />}

                                  {task.status === 'success' && <CheckCircleOutlineIcon color="primary" />}
                                </ListItem>
                              </FullWidthList>
                            </StyledAccordionDetails>
                          </Accordion>
                        )) : null}
                      </FullWidthList>
                    </StyledAccordionDetails>
                  </Accordion>
                )) : null}
              </FullWidthList>
            </StyledAccordionDetails>
          </Accordion>
        ))}
      </React.Fragment>
    </ScrollableTasksContainer>
  );
};

TasksDisplay.defaultProps = {
  jobs: {},
};

TasksDisplay.propTypes = {
  jobs: PropTypes.objectOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      tasks: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        }),
      ),
      name: PropTypes.string.isRequired,
      status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    }),
  ),
};

export default TasksDisplay;
