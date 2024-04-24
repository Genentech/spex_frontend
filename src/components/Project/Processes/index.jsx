import React, { Fragment, useState, useMemo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { matchPath, useLocation } from 'react-router-dom';


import Button, { ButtonSizes, ButtonColors } from '+components/Button';
import ConfirmModal, { ConfirmActions } from '+components/ConfirmModal';
import Link from '+components/Link';
import Table, { ButtonsCell } from '+components/Table';
import PathNames from '@/models/PathNames';
import { actions as processActions, selectors as processSelectors } from '@/redux/modules/processes';

import ButtonsContainer from './components/ButtonsContainer';
import ProcessFormModal from './components/ProcessFormModal';

const defaultProcess = {
  name: '',
};

const refreshInterval = 6e4; // 1 minute

const Processes = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const matchProjectPath = matchPath(location.pathname, { path: `/${PathNames.projects}/:id` });
  const projectId = matchProjectPath ? matchProjectPath.params.id : undefined;

  const [processToManage, setProcessToManage] = useState(null);
  const [processToDelete, setProcessToDelete] = useState(null);
  const [refresher, setRefresher] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetched_processes = useSelector(processSelectors.getProcesses(projectId)) || {};
  let filtered_processes = {};

  filtered_processes = useMemo(
    () => {
        let data = {};
        Object.keys(fetched_processes).forEach((key) => {
            if ( fetched_processes[key]['project'] === projectId ) {
                let obj = {};
                obj[key] = fetched_processes[key];
                data = { ...data, ...obj };
            }
          },
        );
        return data;
    },
    [fetched_processes, projectId],
  );

  const onManageProcessModalOpen = useCallback(
    (process) => {
      setProcessToManage(process);
    },
    [],
  );

  const onManageProcessModalClose = useCallback(
    () => {
      setProcessToManage(null);
    },
    [],
  );

  const onManageProcessModalSubmit = useCallback(
    (values) => {
      const normalizedProcess = {
        ...values,
      };

      if (normalizedProcess.id) {
        dispatch(processActions.updateProcess(normalizedProcess));
      } else {
        dispatch(processActions.createProcess(normalizedProcess));
      }
      setProcessToManage(null);
    },
    [dispatch],
  );

  const onDeleteProcessModalOpen = useCallback(
    (process) => {
      setProcessToDelete(process);
    },
    [],
  );

  const onDeleteProcessModalClose = useCallback(
    () => {
      setProcessToDelete(null);
    },
    [],
  );

  const onDeleteProcessModalSubmit = useCallback(
    () => {
      dispatch(processActions.deleteProcess([projectId, processToDelete.id]));
      setProcessToDelete(null);
    },
    [dispatch, processToDelete, projectId],
  );

  const columns = useMemo(
    () => ([{
      accessor: 'id',
      Header: 'id',
      getCellProps: () => ({ style: { textTransform: 'capitalize' } }),
      Cell: ({ row: { original: { id } } }) => useMemo(
        () => (
          <Link
            to={`/${PathNames.projects}/${projectId}/${PathNames.processes}/${id}`}
            underline="always"
          >
            {id}
          </Link>
        ),
        [id],
      ),
      minWidth: 50,
      maxWidth: 80,
    }, {
      accessor: 'name',
      Header: 'name',
      getCellProps: () => ({ style: { textTransform: 'capitalize' } }),
      Cell: ({ row: { original: { name, id } } }) => useMemo(
        () => (
          <Link
            to={`/${PathNames.projects}/${projectId}/${PathNames.processes}/${id}`}
            underline="always"
          >
            {name}
          </Link>
        ),
        [id, name],
      ),
    },{
      accessor: 'status',
      Header: 'status',
      Cell: ({ row: { original: { status } } }) => useMemo(
        () => {
          let statusAsString;
          switch (status) {
            case null:
            case undefined:
              statusAsString = 'N/A';
              break;
            case 0:
              statusAsString = 'Waiting To Process';
              break;
            case 100:
              statusAsString = 'Done';
              break;
            default:
              statusAsString = 'In Progress';
              break;
          }

          return statusAsString;
        },
        [status],
      ),
    }, {
      accessor: 'author',
      Header: 'author',
      getCellProps: () => ({ style: { textTransform: 'capitalize' } }),
      Cell: ({ row: { original: { author } } }) => useMemo(
        () => author?.login || 'Unknown',
        [author],
      ),
    }, {
      Header: 'actions',
      minWidth: 180,
      maxWidth: 180,
      Cell: ({ row: { original } }) => useMemo(
        () => (
          <ButtonsCell>
            <Button
              size={ButtonSizes.small}
              color={ButtonColors.secondary}
              variant="outlined"
              onClick={() => onDeleteProcessModalOpen(original)}
            >
              Delete
            </Button>

            <Button
              size={ButtonSizes.small}
              color={ButtonColors.secondary}
              variant="outlined"
              onClick={() => onManageProcessModalOpen(original)}
            >
              Edit
            </Button>

            <Button
              size={ButtonSizes.small}
              color={ButtonColors.secondary}
              variant="outlined"
              onClick={() => {
                const { id, ...copy } = original;
                onManageProcessModalOpen(copy);
              }}
            >
              Copy
            </Button>
          </ButtonsCell>
        ),
        [original],
      ),
    }]),
    [onDeleteProcessModalOpen, onManageProcessModalOpen, projectId],
  );

  useEffect(
    () => {
      if (!projectId) {
        return;
      }
      dispatch(processActions.fetchProcesses(projectId));
    },
    [dispatch, projectId, refresher],
  );

  useEffect(
    () => {
      const intervalId = setInterval(() => {
        setRefresher(Date.now());
      }, refreshInterval);
      return () => {
        clearInterval(intervalId);
      };
    },
    [dispatch],
  );

  return (
    <Fragment>
      <ButtonsContainer>
        <Button onClick={() => {
          const newProject = { ...defaultProcess, project: `${projectId}` };
          onManageProcessModalOpen(newProject);
        }}
        >
          Add Process
        </Button>
      </ButtonsContainer>

      <Table
        columns={columns}
        data={Object.values(filtered_processes)}
      />

      {processToManage ? <ProcessFormModal
        header={`${processToManage.id ? 'Edit' : 'Add'} Process`}
        initialValues={processToManage}
        onClose={onManageProcessModalClose}
        onSubmit={onManageProcessModalSubmit}
        open
                         /> : null}

      {processToDelete ? <ConfirmModal
        action={ConfirmActions.delete}
        item={processToDelete.name}
        onClose={onDeleteProcessModalClose}
        onSubmit={onDeleteProcessModalSubmit}
        open
                         /> : null}
    </Fragment>
  );
};

export default Processes;
