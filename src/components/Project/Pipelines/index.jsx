import React, { Fragment, useState, useMemo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { matchPath, useLocation } from 'react-router-dom';

import PathNames from '@/models/PathNames';
import { actions as pipelineActions, selectors as pipelineSelectors } from '@/redux/modules/pipelines';

import Button, { ButtonSizes, ButtonColors } from '+components/Button';
import ConfirmModal, { ConfirmActions } from '+components/ConfirmModal';
import Link from '+components/Link';
import Table, { ButtonsCell } from '+components/Table';

import ButtonsContainer from './components/ButtonsContainer';
import PipelineFormModal from './components/PipelineFormModal';

const defaultPipeline = {
  name: '',
};

const refreshInterval = 6e4; // 1 minute

const Pipelines = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const matchProjectPath = matchPath(location.pathname, { path: `/${PathNames.projects}/:id` });
  const projectId = matchProjectPath ? matchProjectPath.params.id : undefined;

  const [pipelineToManage, setPipelineToManage] = useState(null);
  const [pipelineToDelete, setPipelineToDelete] = useState(null);
  const [refresher, setRefresher] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetched_pipelines = useSelector(pipelineSelectors.getPipelines(projectId)) || {};
  let filtered_pipelines = {};

  filtered_pipelines = useMemo(
    () => {
        let data = {};
        Object.keys(fetched_pipelines).forEach((key) => {
            if ( fetched_pipelines[key]['project'] === projectId ) {
                let obj = {};
                obj[key] = fetched_pipelines[key];
                data = { ...data, ...obj };
            }
          },
        );
        return data;
    },
    [fetched_pipelines, projectId],
  );

  const onManagePipelineModalOpen = useCallback(
    (pipeline) => {
      setPipelineToManage(pipeline);
    },
    [],
  );

  const onManagePipelineModalClose = useCallback(
    () => {
      setPipelineToManage(null);
    },
    [],
  );

  const onManagePipelineModalSubmit = useCallback(
    (values) => {
      const normalizedPipeline = {
        ...values,
      };

      if (normalizedPipeline.id) {
        dispatch(pipelineActions.updatePipeline(normalizedPipeline));
      } else {
        dispatch(pipelineActions.createPipeline(normalizedPipeline));
      }

      setPipelineToManage(null);
    },
    [dispatch],
  );

  const onDeletePipelineModalOpen = useCallback(
    (pipeline) => {
      setPipelineToDelete(pipeline);
    },
    [],
  );

  const onDeletePipelineModalClose = useCallback(
    () => {
      setPipelineToDelete(null);
    },
    [],
  );

  const onDeletePipelineModalSubmit = useCallback(
    () => {
      dispatch(pipelineActions.deletePipeline([projectId, pipelineToDelete.id]));
      setPipelineToDelete(null);
    },
    [dispatch, pipelineToDelete, projectId],
  );

  const columns = useMemo(
    () => ([{
      accessor: 'id',
      Header: 'id',
      getCellProps: () => ({ style: { textTransform: 'capitalize' } }),
      Cell: ({ row: { original: { id } } }) => useMemo(
        () => (
          <Link
            to={`/${PathNames.projects}/${projectId}/${PathNames.pipelines}/${id}`}
            underline="always"
          >
            {id}
          </Link>
        ),
        [id],
      ),
      minWidth: 50,
      maxWidth: 50,
    }, {
      accessor: 'name',
      Header: 'name',
      getCellProps: () => ({ style: { textTransform: 'capitalize' } }),
      Cell: ({ row: { original: { name, id } } }) => useMemo(
        () => (
          <Link
            to={`/${PathNames.projects}/${projectId}/${PathNames.pipelines}/${id}`}
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
              onClick={() => onDeletePipelineModalOpen(original)}
            >
              Delete
            </Button>
            <Button
              size={ButtonSizes.small}
              color={ButtonColors.secondary}
              variant="outlined"
              onClick={() => onManagePipelineModalOpen(original)}
            >
              Edit
            </Button>
            <Button
              size={ButtonSizes.small}
              color={ButtonColors.secondary}
              variant="outlined"
              onClick={() => {
                const { id, ...copy } = original;
                onManagePipelineModalOpen(copy);
              }}
            >
              Copy
            </Button>
          </ButtonsCell>
        ),
        [original],
      ),
    }]),
    [onDeletePipelineModalOpen, onManagePipelineModalOpen, projectId],
  );

  useEffect(
    () => {
      if (!projectId) {
        return;
      }
      dispatch(pipelineActions.fetchPipelines(projectId));
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
          const newProject = { ...defaultPipeline, project: `${projectId}` };
          onManagePipelineModalOpen(newProject);
        }}
        >
          Add Pipeline
        </Button>
      </ButtonsContainer>

      <Table
        columns={columns}
        data={Object.values(filtered_pipelines)}
      />

      {pipelineToManage && (
        <PipelineFormModal
          header={`${pipelineToManage.id ? 'Edit' : 'Add'} Pipeline`}
          initialValues={pipelineToManage}
          onClose={onManagePipelineModalClose}
          onSubmit={onManagePipelineModalSubmit}
          open
        />
      )}

      {pipelineToDelete && (
        <ConfirmModal
          action={ConfirmActions.delete}
          item={pipelineToDelete.name}
          onClose={onDeletePipelineModalClose}
          onSubmit={onDeletePipelineModalSubmit}
          open
        />
      )}
    </Fragment>
  );
};

export default Pipelines;
