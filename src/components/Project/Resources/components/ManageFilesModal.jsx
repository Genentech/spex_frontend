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
    () => Object.values(files).filter((file) => !project.file_names.includes(file.filename)),
    [files, project],
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

      const updatedFileNames = Array.from(new Set([...project.file_names, ...selectedFilenames]));

      onSubmit(project, updatedFileNames);
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
    if (project && project.file_names) {
      setSelectedRows(data.filter((row) => project.file_names.includes(row.filename)));
    }
  }, [project, data]);

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
          selectedRowIds={selectedRows.map((row) => row.filename)}
          initialSelectedRowIds={project?.file_names}
        />
      </ModalBody>
      <ModalFooter>
        <Button
          color={ButtonColors.secondary}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          color={ButtonColors.primary}
          onClick={emitSubmit}
        >
          Attach
        </Button>
      </ModalFooter>
    </Modal>
  );
})`  
`;

ManageFilesModal.propTypes = {
  className: PropTypes.string,
  header: PropTypes.string,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
};

export default ManageFilesModal;
