import React, { Fragment, useState, useMemo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import PathNames from '@/models/PathNames';

import { actions as jobsActions, selectors as jobsSelectors } from '@/redux/modules/jobs';

import Button, { ButtonSizes, ButtonColors } from '+components/Button';
import ConfirmModal, { ConfirmActions } from '+components/ConfirmModal';
import Link from '+components/Link';
import Table, { ButtonsCell } from '+components/Table';

import ButtonsContainer from './components/ButtonsContainer';
import JobFormModal from './components/JobFormModal';
import SubComponent from './components/SubComponent';

const defaultJob = {
  name: '',
  omeroIds: [],
  content: {
    c: 0,
    size: 20,
    slice: { x: 100, y: 100, margin: 31 },
    segment: false,
    start: { x: undefined, y: undefined },
    stop: { x: undefined, y: undefined },
  },
};

const refreshInterval = 6e4; // 1 minute

const Jobs = () => {
  const dispatch = useDispatch();

  const jobs = useSelector(jobsSelectors.getJobs);

  const [ jobToManage, setJobToManage ] = useState(null);
  const [ jobToDelete, setJobToDelete ] = useState(null);
  const [ refresher, setRefresher ] = useState(null);

  const onManageJobModalOpen = useCallback(
    (job) => { setJobToManage(job); },
    [],
  );

  const onManageJobModalClose = useCallback(
    () => { setJobToManage(null); },
    [],
  );

  const onManageJobModalSubmit = useCallback(
    // Omit single field
    ({ single, ...values }) => {
      const omeroIds = values.omeroIds.map((el) => +(el.id || el));
      const normalizedJob = { ...values, omeroIds, content: JSON.stringify(values.content) };
      if (normalizedJob.id) {
        dispatch(jobsActions.updateJob(normalizedJob));
      } else {
        dispatch(jobsActions.createJob(normalizedJob));
      }
      setJobToManage(null);
    },
    [dispatch],
  );

  const onDeleteJobModalOpen = useCallback(
    (job) => { setJobToDelete(job); },
    [],
  );

  const onDeleteJobModalClose = useCallback(
    () => { setJobToDelete(null); },
    [],
  );

  const onDeleteJobModalSubmit = useCallback(
    () => {
      dispatch(jobsActions.deleteJob(jobToDelete.id));
      setJobToDelete(null);
    },
    [dispatch, jobToDelete],
  );

  const columns = useMemo(
    () => ([{
      id: 'status',
      accessor: ({ tasks }) => {
        if (!tasks?.length) {
          return undefined;
        }
        const sum = tasks.reduce((acc, el) => acc + el.status, 0);
        return sum / tasks.length;
      },
      Header: 'Status',
      Cell: ({ value: status }) => useMemo(
        () => (status != null ? `In Progress (${Math.round(status * 100)}%)` : 'N/A'),
        [status],
      ),
    }, {
      id: 'name',
      accessor: 'name',
      Header: 'Name',
      Cell: ({ row: { original: { id, name } } }) => useMemo(
        () => (
          <Link to={`/${PathNames.jobs}/${id}`}>
            {name}
          </Link>
        ),
        [id, name],
      ),
    }, {
      id: 'omeroIds',
      accessor: 'omeroIds',
      Header: 'Omero Image IDs',
    }, {
      id: 'actions',
      Header: 'Actions',
      minWidth: 110,
      maxWidth: 110,
      Cell: ({ row: { original } }) => useMemo(
        () => (
          <ButtonsCell>
            <Button
              size={ButtonSizes.small}
              color={ButtonColors.secondary}
              variant="outlined"
              onClick={() => onDeleteJobModalOpen(original)}
            >
              Delete
            </Button>
            <Button
              size={ButtonSizes.small}
              color={ButtonColors.secondary}
              variant="outlined"
              onClick={() => onManageJobModalOpen(original)}
            >
              Edit
            </Button>
            <Button
              size={ButtonSizes.small}
              color={ButtonColors.secondary}
              variant="outlined"
              onClick={() => {
                const { id, ...copy } = original;
                onManageJobModalOpen(copy);
              }}
            >
              Copy
            </Button>
          </ButtonsCell>
        ),
        [original],
      ),
    }]),
    [onDeleteJobModalOpen, onManageJobModalOpen],
  );

  useEffect(
    () => {
      dispatch(jobsActions.fetchJobs());
      return () => {
        dispatch(jobsActions.clearJobs());
      };
    },
    [dispatch, refresher],
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
        <Button onClick={() => onManageJobModalOpen(defaultJob)}>
          Add Job
        </Button>
      </ButtonsContainer>

      <Table
        columns={columns}
        data={Object.values(jobs)}
        SubComponent={SubComponent}
      />

      {jobToManage && (
        <JobFormModal
          header={`${jobToManage.id ? 'Edit' : 'Add'} Job`}
          initialValues={jobToManage}
          onClose={onManageJobModalClose}
          onSubmit={onManageJobModalSubmit}
          open
        />
      )}

      {jobToDelete && (
        <ConfirmModal
          action={ConfirmActions.delete}
          item={jobToDelete.name}
          onClose={onDeleteJobModalClose}
          onSubmit={onDeleteJobModalSubmit}
          open
        />
      )}
    </Fragment>
  );
};

export default Jobs;
