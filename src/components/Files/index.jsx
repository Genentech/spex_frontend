import React, { useMemo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { actions as filesActions, selectors as filesSelectors } from '@/redux/modules/files';

import Button, { ButtonSizes, ButtonColors } from '+components/Button';
import Table, { ButtonsCell } from '+components/Table';

const Files = () => {
  const dispatch = useDispatch();

  const filesData = useSelector(filesSelectors.getFiles);
  const fileKeys = useSelector(filesSelectors.getFileKeys);
  useEffect(() => {
    dispatch(filesActions.fetchFiles());
  }, [dispatch]);

  const files = useMemo(() => {
    const filesArray = [];

    if (filesData && Array.isArray(filesData)) {
      filesData.forEach((file) => {
        if (file.type === 'file') {
          filesArray.push({ name: file.filename, type: file.type });
        }
      });
    }

    return filesArray;
  }, [filesData]);

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
              <div>
                {fileKeys[original.name] && fileKeys[original.name].join(', ')}
              </div>
            ),
            [original],
          ),
      },
    ],
    [onCheckFile, fileKeys],
  );

  return (
    <Table columns={columns} data={files} />
  );
};

export default Files;
