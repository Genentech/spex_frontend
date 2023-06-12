import React, { useMemo, useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { matchPath, useLocation } from 'react-router-dom';
import PathNames from '@/models/PathNames';
import { actions as filesActions, selectors as filesSelectors } from '@/redux/modules/files';
import { selectors as projectsSelectors } from '@/redux/modules/projects';
import Button, { ButtonSizes, ButtonColors } from '+components/Button';
import ConfirmModal, { ConfirmActions } from '+components/ConfirmModal';
import ErrorMessage from '+components/ErrorMessage';
import FilePicker from '+components/SelectFile';
import Table, { ButtonsCell } from '+components/Table';

const Files = ({ hideUploadButton = false }) => {
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

  const onFileChange = useCallback(async (file) => {
    await dispatch(filesActions.uploadFile(file));
  }, [dispatch]);

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

  const files = useMemo(() => {
    let filesArray = [];

    if (filesData && Array.isArray(filesData)) {
      for (const file of filesData) {
        if (project) {
          if (file.type === 'file' && project?.file_names.includes(file.filename)) {
            filesArray.push({ name: file.filename, type: file.type });
          }
        } else {
          if (file.type === 'file') {
            filesArray.push({ name: file.filename, type: file.type });
          }
        }
      }
    }

    return filesArray;
  }, [filesData, project]);

  const onCheckFile = useCallback(
    (file) => {
      dispatch(filesActions.checkFile(file));
    },
    [dispatch],
  );

  const columns = useMemo(
    () => [
      {
        id: 'name',
        accessor: 'name',
        Header: 'File Name',
      },
      {
        id: 'type',
        accessor: 'type',
        Header: 'Type',
      },
      {
        id: 'actions',
        Header: 'Actions',
        minWidth: 80,
        maxWidth: 80,
        Cell: ({ row: { original } }) =>
          useMemo(
            () => (
              <ButtonsCell>
                <Button
                  size={ButtonSizes.small}
                  color={ButtonColors.secondary}
                  variant="outlined"
                  onClick={() => onCheckFile(original)}
                >
                  Check
                </Button>
                <Button
                  size={ButtonSizes.small}
                  color={ButtonColors.secondary}
                  variant="outlined"
                  onClick={() => onDeleteFileModalOpen(original)}
                >
                  Delete
                </Button>
              </ButtonsCell>
            ),
            [original],
          ),
      },
      {
        id: 'keys',
        Header: 'Keys',
        Cell: ({ row: { original } }) =>
          useMemo(
            () => (
              <div>{fileKeys[original.name] && fileKeys[original.name].join(', ')}</div>
            ),
            [original],
          ),
      },
    ],
    [fileKeys, onDeleteFileModalOpen, onCheckFile],
  );

  return (
    <React.Fragment>
      {error && <ErrorMessage message={error} />}
      {!hideUploadButton && <FilePicker onFileChange={onFileChange} />}
      <Table
        columns={columns}
        data={files}
      />
      {fileToDelete && (
        <ConfirmModal
          action={ConfirmActions.delete}
          item={fileToDelete.name}
          onClose={onDeleteFileModalClose}
          onSubmit={onDeleteFileModalSubmit}
          open
        />
      )}
    </React.Fragment>
  );
};

Files.propTypes = {
  hideUploadButton: PropTypes.bool,
};

Files.defaultProps = {
  hideUploadButton: false,
};

export default Files;
