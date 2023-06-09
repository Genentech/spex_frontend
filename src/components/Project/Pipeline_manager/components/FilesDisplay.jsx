import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Accordion,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Button,
  AccordionSummary,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { matchPath, useLocation } from 'react-router-dom';
import PathNames from '@/models/PathNames';
import { actions as filesActions, selectors as filesSelectors } from '@/redux/modules/files';
import { selectors as projectsSelectors } from '@/redux/modules/projects';
import ConfirmModal, { ConfirmActions } from '+components/ConfirmModal';
import ErrorMessage from '+components/ErrorMessage';

const FilesDisplay = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const matchProjectPath = matchPath(location.pathname, { path: `/${PathNames.projects}/:id` });
  const projectId = matchProjectPath ? matchProjectPath.params.id : undefined;
  const filesData = useSelector(filesSelectors.getFiles);
  const fileKeys = useSelector(filesSelectors.getFileKeys);
  const error = useSelector(filesSelectors.getError);
  const project = useSelector(projectsSelectors.getProject(projectId));

  const [fileToDelete, setFileToDelete] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    dispatch(filesActions.fetchFiles());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  const onDeleteFileModalOpen = useCallback(
    (file) => {
      setFileToDelete(file);
    },
    [],
  );

  const onDeleteFileModalClose = useCallback(
    () => {
      setFileToDelete(null);
    },
    [],
  );

  const onDeleteFileModalSubmit = useCallback(
    async () => {
      try {
        await dispatch(filesActions.deleteFile(fileToDelete));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
      setFileToDelete(null);
    },
    [dispatch, fileToDelete],
  );

  const onCheckFile = useCallback(
    (file) => {
      dispatch(filesActions.checkFile(file));
    },
    [dispatch],
  );

  const projectFiles = useMemo(() => {
    if (Array.isArray(filesData) && project) {
      return filesData.filter((file) => project.file_names.includes(file.filename));
    }
    return [];
  }, [filesData, project]);

  return (
    <React.Fragment>
      {error && <ErrorMessage message={error} />}
      {projectFiles.map((file, i) => (
        <Accordion key={file.filename}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <ListItemText primary={`File ${i + 1}: ${file.filename}`} />
          </AccordionSummary>
          <AccordionDetails>
            <List component="div">
              <ListItem>
                <ListItemText primary={`File name: ${file.filename}`} secondary={`Type: ${file.type}`} />
              </ListItem>
              <ListItem>
                <Button variant="contained" color="primary" onClick={() => onCheckFile(file)}>
                  Check
                </Button>
                <Button variant="contained" color="secondary" onClick={() => onDeleteFileModalOpen(file)}>
                  Delete
                </Button>
              </ListItem>
              <ListItem>
                {fileKeys[file.filename] && fileKeys[file.filename].join(', ')}
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>
      ))}
      {fileToDelete && (
        <ConfirmModal
          action={ConfirmActions.delete}
          item={fileToDelete.filename}
          onClose={onDeleteFileModalClose}
          onSubmit={onDeleteFileModalSubmit}
          open
        />
      )}
    </React.Fragment>
  );
};

export default FilesDisplay;
