import React, { useState, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { actions as filesActions, selectors as filesSelectors } from '@/redux/modules/files';

import Button, { ButtonColors } from '+components/Button';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '+components/Modal';
import Table from '+components/Table';

const ManageFilesModal = styled((props) => {
  const {
    className,
    header,
    project,
    checkedIds,
    closeButtonText,
    submitButtonText,
    onClose,
    open,
    onSubmit,
  } = props;

  const dispatch = useDispatch();

  const [selectedRows, setSelectedRows] = useState([]);
  const files = useSelector(filesSelectors.getFiles);

  const columns = useMemo(
    () => ([
      {
        id: 'filename',
        accessor: 'filename',
        Header: 'File Name',
      },
      {
        id: 'type',
        accessor: 'type',
        Header: 'Type',
      },
    ]),
    [],
  );

  const data = useMemo(
    () => Object.values(files),
    [files],
  );

  const emitSubmit = useCallback(
    () => {
      const selectedFilenames = selectedRows.map((el) => {
        const filename = String(el?.filename) || String(el);
        const file = Object.values(files).find((file) => file.filename === filename);
        if (file) {
          return file.filename;
        } else {
          return null;
        }
      }).filter((filename) => filename !== null);

      onSubmit(project, selectedFilenames);
    },
    [onSubmit, selectedRows, project, files],
  );

  useEffect(
    () => {
      if (Object.keys(files || {}).length) {
        return;
      }

      dispatch(filesActions.fetchFiles());
    },
    [dispatch, files],
  );

  useEffect(() => {
    if (checkedIds.length) {
      setSelectedRows(data.filter((row) => checkedIds.includes(row.filename)));
    }
  }, [checkedIds, data]);

  return (
    <Modal
      className={className}
      open={open}
      onClose={onClose}
    >
      <ModalHeader>{header}</ModalHeader>
      <ModalBody>
        <Table
          columns={columns}
          data={data}
          allowRowSelection
          onSelectedRowsChange={setSelectedRows}
          selectedRowIds={project?.file_names}
          initialSelectedRowIds={checkedIds}
        />
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
  // Вставьте сюда дополнительные стили, если необходимо
`;

ManageFilesModal.propTypes = {
  className: PropTypes.string,
  header: PropTypes.string,
  open: PropTypes.bool,
  checkedIds: PropTypes.arrayOf(PropTypes.string),
  closeButtonText: PropTypes.string,
  submitButtonText: PropTypes.string,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
};

export default ManageFilesModal;
