/* eslint-disable react/jsx-sort-default-props */
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import Button, { ButtonColors } from '+components/Button';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '+components/Modal';
import Table from '+components/Table';
import { actions as jobsActions, selectors as jobsSelectors } from '@/redux/modules/jobs';
import { actions as tasksActions, selectors as tasksSelectors } from '@/redux/modules/tasks';


import SubComponent from './SubComponent';
import Col from '../../components/Col';
import Row from '../../components/Row';

const ManageTasksModal = styled((props) => {
  const {
    className,
    header,
    project,
    closeButtonText,
    submitButtonText,
    onClose,
    open,
    onSubmit,
  } = props;

  const dispatch = useDispatch();
  const jobs = useSelector(jobsSelectors.getJobs);
  const tasks = useSelector(tasksSelectors.getTasks);
  const selectedRef = useRef({});
  const [selectedRows, setSelectedRows] = useState([]);

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
        () => {
          if (status == null) {
            return 'N/A';
          }
          if (Math.round(status) === 0) {
            return 'Waiting To Process';
          }
          if (Math.round(status) === 100) {
            return 'Done';
          }
          return 'In Progress';
        },
        [status],
      ),
    }, {
      id: 'name',
      accessor: 'name',
      Header: 'Name',
      Cell: ({ row: { original: { name } } }) => useMemo(
        () => (<div>{name}</div>),
        [name],
      ),
    }, {
      id: 'omeroIds',
      accessor: 'omeroIds',
      Header: 'Omero Image IDs',
    }]),
    [],
  );

  const tasksColumns = useMemo(
    () => ([
      {
        id: 'id',
        accessor: 'id',
        Header: 'id',
      },
      {
        id: 'name',
        accessor: 'name',
        Header: 'name',
      },
    ]),
    [],
  );

  const data = useMemo(
    () => Object.values(jobs),
    [jobs],
  );

  const tasksData = useMemo(
    () => {
      if (project.taskIds.length === 0 || tasks.length === 0) {
        return [];
      }
      if (selectedRows.length === 0) {
        setSelectedRows(project.taskIds);
        return Object.values(tasks).filter((task) => selectedRows.indexOf(task.id) > -1);
      } else {
        return Object.values(tasks).filter((task) => selectedRows.indexOf(task.id) > -1);
      }
    },

    [tasks, selectedRows, project.taskIds],
  );

  const emitSubmit = useCallback(
    () => {
      const selected = Object.values(selectedRows).flat();
      onSubmit(project, selected);
    },
    [onSubmit, selectedRows, project],
  );

  useEffect(
    () => {
      if (Object.keys(jobs || {}).length) {
        return;
      }
      dispatch(jobsActions.fetchJobs({}));
    },
    [dispatch, jobs],
  );

  useEffect(
    () => {
      if (project.taskIds.length === 0 || Object.keys(tasks || {}).length !== 0) {
        return;
      }

      dispatch(tasksActions.fetchTasks({}));
    },
    [dispatch, tasks, project.taskIds.length],
  );

  useEffect(
    () => {
      if (project.taskIds.length > 0 && Object.keys(tasks || {}).length !== 0 && Object.keys(jobs || {}).length !== 0) {
        let curr = {};
        Object.values(jobs).forEach(function (o) {
          curr[o.id] = [];
          project.taskIds.forEach(function (tid) {
            if (o.tasks.find((task) => task.id === tid))
              curr[o.id].push(tasks[tid].id);
          });
        });
        selectedRef.current = curr;
      }
    },
    [jobs, project.taskIds, tasks],
  );

  const onSelectedRowsChange = useCallback(
    (selected, parent) => {
      selectedRef.current[parent.id] = selected.map(({ id }) => id);
      const unqAr = Array.from(new Set(Object.values(selectedRef.current).flat()));
      setSelectedRows(unqAr);
    },
    [],
  );

  const WithSelected = useCallback(
    (subProps) => {
      return (
        <SubComponent
          {...subProps}
          selectedRowIds={project.taskIds}
          onSelectedRowsChange={(selected) => onSelectedRowsChange(selected, subProps)}
        />
      );
    },
    [onSelectedRowsChange, project.taskIds],
  );

  return (
    <Modal
      className={className}
      open={open}
      onClose={onClose}
    >
      <ModalHeader>{header}</ModalHeader>

      <ModalBody>
        <Row>
          <Col>
            <Table
              columns={columns}
              data={data}
              SubComponent={WithSelected}
            />

            <Table
              columns={tasksColumns}
              data={tasksData}
            />
          </Col>
        </Row>
      </ModalBody>

      <ModalFooter>
        <Button
          color={ButtonColors.secondary}
          onClick={onClose}
        >
          {closeButtonText}
        </Button>

        <Button
          color={ButtonColors.primary}
          onClick={emitSubmit}
        >
          {submitButtonText}
        </Button>
      </ModalFooter>
    </Modal>
  );
})`
  ${Row} + ${Row} {
    margin-top: 20px;
  }
  
  .modal-content {
    width: 800px;
  }

  .transfer-list {
    height: 300px;
    margin: 0 auto;
  }
`;

ManageTasksModal.propTypes = {
  /**
   * Override or extend the styles applied to the component.
   */
  className: PropTypes.string,
  /**
   * Modal title.
   */
  header: PropTypes.string,
  /**
   * If true, the modal is open.
   */
  open: PropTypes.bool,
  /**
   * Text for the close button.
   */
  closeButtonText: PropTypes.string,
  /**
   * Text for the confirm button.
   */
  submitButtonText: PropTypes.string,
  /**
   * Callback fired when the component requests to be closed. .
   */
  onClose: PropTypes.func,
  /**
   * A callback fired when confirm button clicked.
   */
  onSubmit: PropTypes.func,
};

ManageTasksModal.defaultProps = {
  className: '',
  header: '',
  open: false,
  closeButtonText: 'Cancel',
  submitButtonText: 'Submit',
  onClose: () => {},
  onSubmit: () => {},
};

export default ManageTasksModal;
