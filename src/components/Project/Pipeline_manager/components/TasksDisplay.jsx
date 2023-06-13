import React from 'react';
import {
  Accordion,
  ListItem,
  ListItemText,
  List,
  Button,
  CircularProgress,
  AccordionSummary,
  AccordionDetails,
} from '@material-ui/core';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import ErrorIcon from '@material-ui/icons/Error';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const StyledAccordionDetails = styled(AccordionDetails)`
  width: 100%;
`;

const FullWidthList = styled(List)`
  width: 100%;
`;

const TasksDisplay = ({ jobs }) => {
  return (
    <div>
      {Object.values(jobs).map((job, i) => (
        <Accordion key={job.id}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <ListItemText primary={`Job ${i + 1}: ${job.name}`} />
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
                      <ListItem>
                        <ListItemText primary={`Task ID: ${task.id}`} secondary={`Status: ${task.status}`} />
                      </ListItem>
                      <ListItem>
                        {/* eslint-disable-next-line no-console */}
                        <Button variant="contained" color="primary" onClick={() => { console.log(task); }}>
                          Action
                        </Button>
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
    </div>
  );
};

TasksDisplay.defaultProps = {
  jobs: [],
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
