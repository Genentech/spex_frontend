import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
} from '@material-ui/core';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import ErrorIcon from '@material-ui/icons/Error';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import PropTypes from 'prop-types';

const TasksDisplay = ({ selectedBlock }) => {
  const [tasks, setTasks] = useState([]);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (selectedBlock) {
      setTasks(selectedBlock.tasks);
      setErrors(selectedBlock.errors);
    }
  }, [selectedBlock]);

  return (
    <div>
      {tasks.map((task, i) => (
        <div key={task.id}>
          <ListItem>
            <ListItemText primary={`task ${i + 1}: ${task.name}`} />
            <Button variant="contained" color="primary" onClick={() => { console.log(task); }}>
              Action
            </Button>
          </ListItem>
          <div>
            {task.status === 'pending' && <CircularProgress />}
            {task.status === 'error' && <ErrorIcon color="secondary" />}
            {task.status === 'success' && <CheckCircleOutlineIcon color="primary" />}
          </div>
        </div>
      ))}

      {!!selectedBlock?.errors?.length && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <ErrorIcon /> Errors
          </AccordionSummary>
          <AccordionDetails>
            <List dense component="div">
              {selectedBlock.errors.map((item) => (
                <ListItem key={item.id}>
                  <ListItemText primary={`task id: ${item.id}`} />
                  <pre>
                    {item.error}
                  </pre>
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}
    </div>
  );
};

TasksDisplay.defaultProps = {
  selectedBlock: {
    tasks: [],
    errors: [],
  },
};

TasksDisplay.propTypes = {
  selectedBlock: PropTypes.shape({
    tasks: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        status: PropTypes.number.isRequired,
      }),
    ),
    errors: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        error: PropTypes.string.isRequired,
      }),
    ),
  }),
};

export default TasksDisplay;
