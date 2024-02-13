import React, { useState, useEffect, useCallback } from 'react';
import {
  Accordion,
  ListItem,
  ListItemText,
  List,
  CircularProgress,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,

} from '@material-ui/core';
import AssignmentIcon from '@material-ui/icons/Assignment';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import ErrorIcon from '@material-ui/icons/Error';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import PropTypes from 'prop-types';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
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
  const [containerHeight, setContainerHeight] = useState('600px');
  const [openDialog, setOpenDialog] = useState(false);
  const [errorText, setErrorText] = useState('');

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
  const handleTaskClick = (task) => {
    // setSelectedTask(task);
    if(task.error) {
      setErrorText(task.error);
      setOpenDialog(true);
    }
  };

  const handleClose = () => {
    setOpenDialog(false);
  };

  const jobsByStatus = {};
  Object.values(jobs).forEach((job) => {
    if (!jobsByStatus[job.status]) jobsByStatus[job.status] = [];
    jobsByStatus[job.status].push(job);
  });

  const dispatch = useDispatch();
  const onDownload = useCallback(
    async (job_id) => {
      const fileName = `job_${job_id}.zip`;

      dispatch(jobsActions.downloadJob({ jobId: job_id, fileName }));
    },
    [dispatch],
  );

  const jobData = useSelector(jobsSelectors.getJobData);
  const [openDialogLog, setOpenDialogLog] = useState(false);
  const [idJobOpen, setIdJobOpen] = useState(false);

  const handleWindowExpand = useCallback(
    async (jobId) => {
      if (!jobData[jobId]) {
        await dispatch(jobsActions.fetchJobData(jobId));
      }
    },
    [dispatch, jobData],
  );
  const handleLogClose = () => {
    setOpenDialogLog(false);
  };
  const handleLogClick = (job) => {
    setIdJobOpen(job);
    handleWindowExpand(job);
    setOpenDialogLog(true);
  };
  
  return (
    <ScrollableTasksContainer height={containerHeight}>
      {Object.entries(jobsByStatus).map(([status, jobs]) => (
        <Accordion key={status}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <ListItemText
              primary={`Status: ${statusFormatter(status)}`}
            />
          </AccordionSummary>
          <StyledAccordionDetails>
            <FullWidthList component="div">
              {jobs.map((job, i) => (
                <Accordion key={job.id}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <ListItemText
                      primary={`Job ${i + 1}: ${job.name}`}
                      secondary={`Status: ${statusFormatter(job.status)}`}
                    />
                    {job.name === 'feature_extraction' && (
                      <div>
                        <Dialog
                          open={openDialogLog}
                          onClose={handleLogClose}
                          aria-labelledby="alert-dialog-title"
                          aria-describedby="alert-dialog-description"
                        >
                          <DialogTitle id="alert-dialog-title">
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ marginRight: 10 }}>{`Job ${i + 1}: ${job.name}`}</span>
                              <span style={{ fontWeight: 'bold' }}>{`Status: ${statusFormatter(job.status)}`}</span>
                            </div>
                          </DialogTitle>
                          <DialogContent>
                            <DialogContentText id="alert-dialog-description">
                              {jobData[idJobOpen] && <pre>{JSON.stringify(jobData[idJobOpen], null, 2)}</pre>}
                            </DialogContentText>
                          </DialogContent>
                          <DialogActions>
                            <CopyToClipboard text={JSON.stringify(jobData[idJobOpen])}>
                              <Button onClick={handleClose} color="primary" autoFocus>
                                Copy to Clipboard
                              </Button>
                            </CopyToClipboard>
                          </DialogActions>
                        </Dialog>

                        <Button
                          size="small"
                          variant="contained"
                          color="inherit"
                          startIcon={<AssignmentIcon />}
                          onClick={() => handleLogClick(job.id)}
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
                      {job.tasks.map((task, j) => (
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
                                {task.error && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="red"
                                    startIcon={<ErrorIcon />}
                                    onClick={() => handleTaskClick(task)}
                                  >
                                    Info
                                  </Button>
                                )}
                              </ListItem>
                              <ListItem>
                                {task.status === 'pending' && <CircularProgress />}
                                {task.status === 'error' && <ErrorIcon color="secondary" />}
                                {task.status === 'success' && <CheckCircleOutlineIcon color="primary" />}
                              </ListItem>
                            </FullWidthList>
                          </StyledAccordionDetails>
                        </Accordion>
                      ))}
                    </FullWidthList>
                  </StyledAccordionDetails>
                </Accordion>
              ))}
            </FullWidthList>
          </StyledAccordionDetails>
        </Accordion>
      ))}
      <Dialog
        open={openDialog}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Task Error</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {errorText}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <CopyToClipboard text={errorText}>
            <Button onClick={handleClose} color="primary" autoFocus>
              Copy to Clipboard
            </Button>
          </CopyToClipboard>
        </DialogActions>
      </Dialog>

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
