/* eslint-disable react/react-in-jsx-scope, react/prop-types */
import React from 'react';
import Box from '@material-ui/core/Box';
import Alert from '@material-ui/lab/Alert';
import { DataGrid } from '@mui/x-data-grid';
import styled from 'styled-components';

import { ScrollBarMixin } from '+components/ScrollBar';

const columns = [
  { field: 'old', headerName: 'cluster name old', width: 300, editable: true },
  { field: 'new', headerName: 'cluster name new', width: 300, editable: true },
];

const rows = [
  {
    id: 1,
    old: 'cluster1',
    new: 'supper best name of cluster 1',
  },
  {
    id: 2,
    old: 'cluster2',
    new: 'supper best name of cluster 2',
  },
];

// eslint-disable-next-line no-unused-vars
const DataPanel = styled((props) => {
    const {
        className,
        children,
        value,
        index,
        ...other
    } = props;

    return (
      <div style={{ width: '100%' }}>
        <DataGrid
          className={className}
          id={`datagrid-${index}`}
          aria-labelledby={`tab-${index}`}
          {...other}
          columns={columns}
          rows={rows}
          editRowsModel="cell"
        />
      </div>

    );
})`
    overflow: auto;
    height: 100%;

    ${ScrollBarMixin}
`;

export default DataPanel;
