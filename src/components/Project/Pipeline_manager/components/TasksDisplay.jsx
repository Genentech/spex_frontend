import React, { useState, useEffect } from 'react';
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
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import ErrorIcon from '@material-ui/icons/Error';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import PropTypes from 'prop-types';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import styled from 'styled-components';
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
  const [selectedTask, setSelectedTask] = useState(null);
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
    setSelectedTask(task);
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
                              <ListItem
                                button
                                selected={selectedTask === task}
                                onClick={() => handleTaskClick(task)}
                              >
                                <ListItemText
                                  primary={`Task ID: ${task.id}, image id: ${task.omeroId} Status: ${statusFormatter(task.status)}`}
                                  secondary={task.error}
                                >
                                  <ErrorIcon /> {task.error}
                                </ListItemText>
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
