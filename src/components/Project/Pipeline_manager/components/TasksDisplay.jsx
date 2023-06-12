import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  AccordionSummary,
} from '@material-ui/core';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import ErrorIcon from '@material-ui/icons/Error';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import PropTypes from 'prop-types';

const TasksDisplay = ({ allTasks }) => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (allTasks) {
      setTasks(allTasks);
    }
  }, [allTasks]);

  return (
    <div>
      {tasks.map((task, i) => (
        <Accordion key={task.id}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <ListItemText primary={`Task ${i + 1}: ${task.name}`} />
          </AccordionSummary>
          <AccordionDetails>
            <List component="div">
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
            </List>
          </AccordionDetails>
        </Accordion>
      ))}
    </div>
  );
};

TasksDisplay.defaultProps = {
  allTasks: [],
};

TasksDisplay.propTypes = {
  allTasks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  ),
};

export default TasksDisplay;
