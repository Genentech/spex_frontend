// eslint-disable-next-line import/order
import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { useField } from 'react-final-form';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import Button from '+components/Button';

const Container = styled.div`
    height: 100%;
    width: 100%;
    display: grid;
    grid-template-rows: 30px 1fr;
`;

const ButtonRow = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 5px 0px;
`;

const columns = [
    { field: 'field1', headerName: 'Id', type: 'number', width: 150, editable: true, valueFormatter: ({ value }) => value.toString().replace(/\s/g, '') },
    { field: 'field2', headerName: 'Name', width: 180, editable: true },
];

const SelectGrid = () => {
    const [rowsForGrid, setRowsForGrid] = useState([]);
    const { input } = useField('params.cluster_list');
    const [selectedRowsIds, setSelectedRowsIds] = useState([]);

    const transformDataIn = (inputData) => {
        if (!Array.isArray(inputData)) {
            inputData = [inputData];
        }
        return inputData.map((item, index) => ({
            id: uuidv4(),
            field1: Object.keys(item)[0],
            field2: Object.values(item)[0],
        }));
    };

    useEffect(() => {
        setRowsForGrid(transformDataIn(input.value));
    }, [input.value]);

    const transformDataForOut = (rowsForGrid) => {
        return rowsForGrid.map((item) => {
            return {
                [item.field1]: item.field2,
            };
        });
    };
    const reloadData = (newValue) => {
        setRowsForGrid(newValue);
        input.onChange(transformDataForOut(newValue));
    };

    useEffect(() => {
        setSelectedRowsIds([]);
    }, [rowsForGrid.length]);

    const handleDeleteSelectedRows = () => {
        setTimeout(() => {
            const newValue = rowsForGrid.filter((el) => !selectedRowsIds.includes(el.id));
            reloadData(newValue);
        });
    };

    const handleAddRow = () => {
        const newId = uuidv4();
        const newRow = {
            'id': newId,
            'field1': '',
            'field2': '',
        };
        const newValue = [...rowsForGrid, newRow];
        reloadData(newValue);
    };

    const handleEditCellProps = (changes) => {
        const newValue = rowsForGrid.map((el) => {
            if (changes.id === el.id) {
                return {
                    ...el,
                    [changes.field]: changes.props.value,
                };
            }
            return el;
        });
        setRowsForGrid(newValue);
    };
    const handleOnCellEditStop = () => {
        input.onChange(transformDataForOut(rowsForGrid));
    };

    return (
      <Container>
        <ButtonRow>
          <Button size="small" color="default" onClick={handleDeleteSelectedRows} disabled={selectedRowsIds.length === 0}>
            Delete Selected Rows
          </Button>

          <Button size="small" color="default" onClick={handleAddRow}>
            Add Row
          </Button>
        </ButtonRow>

        <DataGrid
          disableSelectionOnClick
          checkboxSelection
          selectionModel={selectedRowsIds}
          onSelectionModelChange={setSelectedRowsIds}
          rows={rowsForGrid || []}
          columns={columns}
          onEditCellPropsChange={handleEditCellProps}
          onCellEditStop={handleOnCellEditStop}
        />
      </Container>
    );
};

export default SelectGrid;

