/* eslint-disable react/jsx-sort-default-props */
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { actions as resourcesActions, selectors as resourcesSelectors } from '@/redux/modules/resources';
import { actions as omeroActions } from '@/redux/modules/omero';

import Button, { ButtonColors, ButtonSizes } from '+components/Button';
import Link from '+components/Link';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '+components/Modal';
import Select, { Option } from '+components/Select';
import Table from '+components/Table';
import SubComponent from './SubComponent';
import CellButtonsContainer from './CellButtonsContainer';


import Row from './Row';


const none = 'none';

const ManageResourcesModal = styled((props) => {
  const {
    className,
    header,
    project,
    closeButtonText,
    submitButtonText,
    onClose,
    open,
    onSubmit
  } = props;

  const dispatch = useDispatch();


  const [value] = useState([]);


  const isResourcesFetching = useSelector(resourcesSelectors.isFetching);
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
          <div onClick={onChange}> {name} </div>

          // </Link>
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
          <CellButtonsContainer>
            <Button
              size={ButtonSizes.small}
              color={ButtonColors.secondary}
              variant="outlined"

            >
              Delete
            </Button>
            <Button
              size={ButtonSizes.small}
              color={ButtonColors.secondary}
              variant="outlined"
            >
              Edit
            </Button>
            <Button
              size={ButtonSizes.small}
              color={ButtonColors.secondary}
              variant="outlined"
            >
              Copy
            </Button>
          </CellButtonsContainer>
        ),
        [original],
        ),
      }]),
      [],
    );



  const emitSubmit = useCallback(
    () => {
      const selected = value.map((el) => String(el?.id) || String(el));
      onSubmit(selected);
    },
    [onSubmit, value],
  );

  const emitCancel = useCallback(
    () => {
      dispatch(omeroActions.fetchThumbnails({
        groupId: project.id,
        imageIds: project.omeroIds,
      }));
    onClose();
    },
    [dispatch, onClose, project],
  );

  const onChange = useCallback(
    (event) => console.log(123),
    [],
  );

  useEffect(
    () => {
      if (!project?.omeroIds?.length) {
        return undefined;
      }

      dispatch(omeroActions.fetchThumbnails({
        groupId: project.id,
        imageIds: project.omeroIds,
      }));
    },
    [dispatch, project?.id, project?.omeroIds],
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
            data={Object.values(resources)}
            allowRowSelection
          />
        </Row>
      </ModalBody>
      <ModalFooter>
        <Button
          color={ButtonColors.secondary}
          onClick={emitCancel}
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
