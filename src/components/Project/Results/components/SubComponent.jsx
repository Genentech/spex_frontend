import React, { useMemo } from 'react';
import styled from 'styled-components';
import Table from '+components/Table';

export default styled((props) => {
  const { className, actions, original: row, onSelectedRowsChange, selectedRowIds } = props;
  const columns = useMemo(
    () => ([
      {
        id: 'id',
        accessor: 'id',
        Header: 'id',
        Cell: ({ row: { original: { id } } }) => useMemo(
          () => (
            // <Link to={`/${PathNames.jobs}/${id}`}>
            <div> {id} </div>
            // </Link>
          ),
          [id],
        ),
      },
      {
      id: 'status',
      accessor: 'status',
      Header: 'Status',
        Cell: ({ row: { original: { status } } }) => useMemo(
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
      Header: 'job name',
    }]),
    [],
  );

  return (
    <Table
      className={className}
      columns={columns}
      noDataText="No tasks found"
      data={row.jobs || []}
      allowRowSelection
      actions={actions}
      selectedRowIds={selectedRowIds}
      onSelectedRowsChange={onSelectedRowsChange}
    />
  );
})`
  margin-left: 80px;
  width: calc(100% - 80px);

`;
