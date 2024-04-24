/* eslint-disable react/jsx-sort-default-props */
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';


import Button, { ButtonColors } from '+components/Button';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '+components/Modal';
import Table from '+components/Table';
import { actions as resourcesActions, selectors as resourcesSelectors } from '@/redux/modules/resources';
import Row from '../../components/Row';


const ManageResourcesModal = styled((props) => {
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

  const [selectedRows, setSelectedRows] = useState([]);
  const resources = useSelector(resourcesSelectors.getResources);

  const columns = useMemo(
    () => ([
      {
        id: 'name',
        accessor: 'name',
        Header: 'Name',
        Cell: ({ row: { original: { id, name } } }) => useMemo(
          () => (
            // <Link to={`/${PathNames.resources}/${id}`}>
            <div> {id} </div>
            // </Link>
          ),
          [id],
        ),
      }, {
        id: 'omeroIds',
        accessor: 'omeroIds',
        Header: 'Omero Image IDs',
      },
    ]),
    [],
  );

  const data = useMemo(
    () => Object.values(resources),
    [resources],
  );

  const emitSubmit = useCallback(
    () => {
      const selected = selectedRows.map((el) => String(el?.id) || String(el));
      onSubmit(project , selected);
    },
    [onSubmit, selectedRows, project],
  );

  useEffect(
    () => {
      if (Object.keys(resources || {}).length) {
        return;
      }

      dispatch(resourcesActions.fetchResources({}));
    },
    [dispatch, resources],
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
          <Table
            columns={columns}
            data={data}
            allowRowSelection
            onSelectedRowsChange={setSelectedRows}
            selectedRowIds={project?.resource_ids}
          />
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

  .transfer-list {
    height: 300px;
    margin: 0 auto;
  }
`;

ManageResourcesModal.propTypes = {
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

ManageResourcesModal.defaultProps = {
  className: '',
  header: '',
  open: false,
  closeButtonText: 'Cancel',
  submitButtonText: 'Submit',
  onClose: () => {},
  onSubmit: () => {},
  onChange: () => {},
};

export default ManageResourcesModal;
