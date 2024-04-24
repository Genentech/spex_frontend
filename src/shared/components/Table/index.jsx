/* eslint-disable import/no-namespace, react/jsx-sort-default-props */
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Pagination from '@material-ui/core/TablePagination';
import ldEqual from 'lodash/isEqual';
import PropTypes from 'prop-types';
import isEqual from 'react-fast-compare';
import {
  useTable, useExpanded,
  useGroupBy, useFilters,
  useSortBy, usePagination,
  useFlexLayout, useResizeColumns,
  useRowSelect,
} from 'react-table';

import Button from '+components/Button';
import { closest } from '+utils/closest';
import isFunction from '+utils/isFunction';

// Cells
import ButtonsCell from './Cells/ButtonsCell';
import DefaultCell from './Cells/DefaultCell';
import ExpanderCell from './Cells/ExpanderCell';
import RowSelectionCell from './Cells/RowSelectionCell';

// Components
import ActionsContainer from './components/ActionsContainer';
import Body from './components/Body';
import Caption from './components/Caption';
import Container from './components/Container';
import Footer from './components/Footer';
import Header from './components/Header';
import PaginationContainer from './components/PaginationContainer';
import TableContainer from './components/TableContainer';
import TableWrapper from './components/TableWrapper';

// Filters
import BooleanColumnFilter from './Filters/BooleanColumnFilter';
import DefaultColumnFilter from './Filters/DefaultColumnFilter';

// Headers
import DefaultColumnHeader from './Headers/DefaultColumnHeader';
import ExpanderColumnHeader from './Headers/ExpanderColumnHeader';
import RowSelectionColumnHeader from './Headers/RowSelectionColumnHeader';

import * as filterTypes from './Types/filterTypes';
import * as sortTypes from './Types/sortTypes';

const getRowId = (row, relativeIndex, parent) => parent ? [parent.id, row?.id ?? relativeIndex].join('.') : (row?.id ?? relativeIndex);

/**
 * Table displays sets of data.
 */
const Table = (props) => {
  const {
    id,
    className,
    style,
    caption,
    columns,
    hiddenColumns,
    groupBy,
    data,
    noDataText,
    showHeader,
    showFilters,
    showFooter,
    doubleRowSize,
    allowRowSelection,
    actions,
    pageIndex,
    pageSizeOptions,
    defaultSorted,
    defaultFiltered,
    minRows,
    expanderInHeader,
    getTableProps: getUserTableProps,
    getHeaderProps,
    getHeaderGroupProps,
    getFooterProps,
    getFooterGroupProps,
    getRowProps,
    getCellProps,
    SubComponent,
    PaginationComponent,
    onCellValueChange,
    onSelectedRowsChange,
    selectedRowIds,
    onExpandedChange,
  } = props;

  const [doubleRowSpacing] = useState(doubleRowSize);
  const [pageSize, setCurrentPageSize] = useState(props.pageSize);
  const [selectedRows, setSelectedRows] = useState([]);
  const [expanded, setExpandedRows] = useState([]);


  const defaultColumn = useMemo(
    () => ({
      minWidth: 181,
      width: 181,
      Header: DefaultColumnHeader,
      Cell: DefaultCell,
      Aggregated: DefaultCell,
      Filter: DefaultColumnFilter,
    }),
    [],
  );

  const initialHiddenColumns = useMemo(
    () => {
      const result = [...hiddenColumns || []];

      const flatting = (items) => (items || []).forEach((item) => {
        if (Array.isArray(item.columns)) {
          flatting(item.columns);
          return;
        }

        const itemId = item.id || item.accessor;
        if (item.isVisible === false && itemId && !result.includes(itemId)) {
          result.push(itemId);
        }
      });

      flatting(columns);

      return result;
    },
    [columns, hiddenColumns],
  );

  const hasExpander = Boolean(SubComponent) || Boolean(groupBy?.length);

  const useExpanderColumn = useCallback(
    (hooks) => {
      if (!hasExpander) {
        return;
      }

      const column = {
        id: 'expander',
        disableResizing: true,
        minWidth: 35,
        maxWidth: 35,
        expander: true,
        // eslint-disable-next-line react/prop-types
        Header: expanderInHeader ? ExpanderColumnHeader : '',
        Cell: ExpanderCell,
      };

      hooks.visibleColumns.push((cols) => [
        column,
        ...cols,
      ]);
    },
    [hasExpander, expanderInHeader],
  );

  const useCheckboxColumn = useCallback(
    (hooks) => {
      if (!allowRowSelection) {
        return;
      }

      const column = {
        id: 'selection',
        accessor: '',
        disableResizing: true,
        disableSortBy: true,
        minWidth: 35,
        maxWidth: 35,
        Header: RowSelectionColumnHeader,
        Cell: RowSelectionCell,
        Filter: BooleanColumnFilter,
      };

      hooks.visibleColumns.push((cols) => [
        column,
        ...cols,
      ]);
    },
    [allowRowSelection],
  );

  const _selectedRowIds = useMemo(
    () => (selectedRowIds || []).reduce((acc, id) => ({
      ...acc,
      [id]: true,
    }), {}),
    [selectedRowIds],
  );

  const instance = useTable(
    {
      columns: columns || [],
      data,
      initialState: {
        sortBy: defaultSorted || [],
        groupBy: groupBy || [],
        filters: defaultFiltered || [],
        hiddenColumns: initialHiddenColumns,
        selectedRowIds: _selectedRowIds,
      },
      defaultColumn,
      filterTypes,
      sortTypes,
      disableFilters: !showFilters,
      autoResetFilters: false,
      autoResetSortBy: false,
      onCellValueChange,
      getRowId,
      autoResetSelectedRows: false,
    },
    useFilters,
    useGroupBy,
    useSortBy,
    useExpanded,
    useExpanderColumn,
    usePagination,
    useResizeColumns,
    useFlexLayout,
    useRowSelect,
    useCheckboxColumn,
  );

  const {
    getTableProps,
    headerGroups,
    footerGroups,
    getTableBodyProps,
    prepareRow,
    page,
    rows,
    state,
    // checkbox
    // isAllRowsSelected,
    // toggleAllRowsSelected,
    selectedFlatRows,
    // expander
    getToggleAllRowsExpandedProps,
    // paginator
    pageCount,
    gotoPage,
    setPageSize,
  } = instance;

  const {
    // paginator state
    pageIndex: currentPageIndex,
    pageSize: currentPageSize,
    // selectedRowIds,
  } = state;

  const onActionClick = useCallback(
    (action) => (event) => {
      if (action) {
        action.fn(selectedRows, event);
      }
    },
    [selectedRows],
  );

  const onDisabledActionClick = useCallback(
    (event) => {
      event.stopPropagation();
      event.preventDefault();
    },
    [],
  );

  const selectedRowActions = useMemo(
    () => {
      if (!Array.isArray(actions)) {
        return null;
      }

      return actions.map((action) => {
        const childProps = {
          disabled: Boolean(action.disabled) || (action.enabledOnlyWhenSelectedRows && !selectedRows.length),
          onMouseDown: onDisabledActionClick,
          onKeyDown: onDisabledActionClick,
        };

        if (!childProps.disabled) {
          childProps.onClick = onActionClick(action);
        }

        return (
          <Button
            {...childProps}
            key={action.name}
            color={action.color}
            icon={action.icon}
          >
            {action.name}
          </Button>
        );
      });
    },
    [actions, onDisabledActionClick, onActionClick, selectedRows],
  );

  const noData = useMemo(
    () => noDataText ?? 'No data found',
    [noDataText],
  );

  const fakeRows = useMemo(
    () => {
      if (minRows < 1 || minRows <= page.length) {
        return [];
      }

      return new Array(Math.max(currentPageSize, Math.max(+minRows, 1)) - page.length)
        .fill('').map((_, i) => i);
    },
    [minRows, currentPageSize, page.length],
  );

  // const clearSelectionButtonText = useMemo(
  //     () => {
  //         const allRowsSelectedText = isAllRowsSelected ? 'all' : '';
  //         const selectedRowCount = Object.keys(selectedRowIds).length;
  //         return `Clear selection${allRowsSelectedText || selectedRowCount
  //             ? ` (${allRowsSelectedText || selectedRowCount})`
  //             : ''}`;
  //     },
  //     [ isAllRowsSelected, selectedRowIds ],
  // );
  //
  // const onClearSelectionButtonClick = useCallback(
  //     () => {
  //         toggleAllRowsSelected(false);
  //     },
  //     [ toggleAllRowsSelected ],
  // );

  useEffect(
    () => {
      if (!PaginationComponent || !isFunction(setPageSize)) {
        return;
      }

      if (pageSize < 1) {
        return;
      }

      if (Array.isArray(pageSizeOptions) && pageSizeOptions.length > 0) {
        const closestPageSize = closest(pageSize, pageSizeOptions);
        if (currentPageSize !== closestPageSize) {
          setPageSize(closestPageSize);
        }
        return;
      }

      setPageSize(pageSize);
    },
    [PaginationComponent, setPageSize, pageSize, pageSizeOptions, currentPageSize],
  );

  useEffect(
    () => {
      if (pageIndex) {
        gotoPage(pageIndex);
      }
    },
    [pageIndex, gotoPage],
  );

  const headerProps = {
    headerGroups,
    getToggleAllRowsExpandedProps,
    expanderInHeader,
    getHeaderProps,
    getHeaderGroupProps,
  };

  const bodyProps = {
    rows: PaginationComponent ? page : rows,
    noData,
    headerGroups,
    fakeRows,
    getTableBodyProps,
    getRowProps,
    getCellProps,
    prepareRow,
    doubleLineSpacing: doubleRowSpacing,
    SubComponent,
  };

  const footerProps = {
    footerGroups,
    getFooterProps,
    getFooterGroupProps,
  };

  const paginatorProps = {
    component: 'div',
    count: rows.length,
    page: currentPageIndex,
    rowsPerPage: pageSize,
    rowsPerPageOptions: pageSizeOptions,
    onChangePage: (_, newPage) => gotoPage(newPage),
    onChangeRowsPerPage: (event) => {
      setCurrentPageSize(parseInt(event.target.value, 10));
      gotoPage(0);
    },
  };

  useEffect(
    () => {
      setSelectedRows((prevValue) => {
        const newSelectedRows = selectedFlatRows.map((d) => d.original);
        return ldEqual(newSelectedRows, prevValue) ? prevValue : newSelectedRows;
      });
    },
    [selectedFlatRows],
  );

  useEffect(
    () => {
      if (onSelectedRowsChange) {
        onSelectedRowsChange(selectedRows);
      }
    },
    [selectedRows, onSelectedRowsChange],
  );

  useEffect(
    () => {
      setExpandedRows(() => {
        return expanded;
      });
    },
    [expanded],
  );


  useEffect(
    () => {
      if (onExpandedChange) {
        onExpandedChange(expanded);
      }
    },
    [expanded, onExpandedChange],
  );

  return (
    <Container
      className={`ReactTable ${className || ''}`}
      id={id}
      style={style}
    >
      <Caption>{caption}</Caption>

      <TableWrapper>
        {allowRowSelection && selectedRowActions.length > 0 ? <ActionsContainer className="selected-row-actions">
          {selectedRowActions}
        </ActionsContainer> : null}

        <TableContainer
          className="rt-table"
          {...getTableProps(getUserTableProps || {})}
        >
          {showHeader ? <Header {...headerProps} /> : null}

          <Body {...bodyProps} />

          {showFooter ? <Footer {...footerProps} /> : null}
        </TableContainer>

        {pageCount > 1 && PaginationComponent ? <PaginationContainer className="pagination-bottom">
          <PaginationComponent {...paginatorProps} />
        </PaginationContainer> : null}
      </TableWrapper>
    </Container>
  );
};

const propTypes = {
  /**
   * Override component ID.
   */
  id: PropTypes.string,
  /**
   * Override or extend the styles applied to the component.
   */
  className: PropTypes.string,
  /**
   * Extend the styles applied to the component.
   */
  style: PropTypes.shape({}),
  /**
   * Table caption.
   */
  caption: PropTypes.string,
  /**
   * The column configuration.
   */
  columns: PropTypes.arrayOf(PropTypes.shape()),
  /**
   * If a column's ID is contained in this array, it will be hidden
   */
  hiddenColumns: PropTypes.arrayOf(PropTypes.string),
  /**
   * Group by this columns.
   */
  groupBy: PropTypes.arrayOf(PropTypes.string),
  /**
   * It's highly recommended that your data have a unique identifier (keyField).
   * The default keyField is id. If you need to override this value then see keyField.
   */
  data: PropTypes.arrayOf(PropTypes.shape()),
  /**
   * Specifies text shown when the component does not display any data.
   */
  noDataText: PropTypes.string,
  /**
   * If true, header will be displayed.
   */
  showHeader: PropTypes.bool,
  /**
   * If true, column filters will be disabled.
   */
  showFilters: PropTypes.bool,
  /**
   * If true, footer will be displayed.
   */
  showFooter: PropTypes.bool,
  /**
   * If true, row size will be doubled.
   */
  doubleRowSize: PropTypes.bool,
  /**
   * If true, row checkbox will be shown.
   */
  allowRowSelection: PropTypes.bool,
  /**
   * Actions that are available inside the table with selected rows.
   */
  actions: PropTypes.arrayOf(PropTypes.shape({
    /**
     * Action name.
     */
    name: PropTypes.string.isRequired,
    /**
     * Action callback.
     */
    fn: PropTypes.func.isRequired,
    /**
     * Action icon.
     */
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.shape({})]),
    /**
     * Action color type.
     */
    color: PropTypes.string,
    /**
     * Is the action disabled.
     */
    disabled: PropTypes.bool,
    /**
     * If true, action will be enabled only if there are selected rows.
     */
    enabledOnlyWhenSelectedRows: PropTypes.bool,
  })),
  /**
   * Sets start page index.
   */
  pageIndex: PropTypes.number,
  /**
   * The default rows per page to use when the table initially loads.
   */
  pageSize: PropTypes.number,
  /**
   * Row page dropdown selection options.
   */
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  /**
   * Min rows count on the page.
   */
  minRows: PropTypes.number,
  /**
   * Default sorted columns.
   */
  defaultSorted: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
  })),
  /**
   * Default filtered columns.
   */
  defaultFiltered: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    value: PropTypes.any,
  })),
  /**
   * If true, expander will be shown in header.
   */
  expanderInHeader: PropTypes.bool,
  /**
   * This function is used to resolve any props needed for table wrapper.
   */
  getTableProps: PropTypes.func,
  /**
   * This function is used to resolve any props needed for this column's header cell.
   */
  getHeaderProps: PropTypes.func,
  /**
   * This function is used to resolve any props needed for this header group's row.
   */
  getHeaderGroupProps: PropTypes.func,
  /**
   * This function is used to resolve any props needed for this column's footer cell.
   */
  getFooterProps: PropTypes.func,
  /**
   * This function is used to resolve any props needed for this footer group's row.
   */
  getFooterGroupProps: PropTypes.func,
  /**
   * This function is used to resolve any props needed for this row.
   */
  getRowProps: PropTypes.func,
  /**
   * This function is used to resolve any props needed for this cell.
   */
  getCellProps: PropTypes.func,
  /**
   * Sub component for expanded rows.
   */
  SubComponent: PropTypes.elementType,
  /**
   * Pagination component.
   */
  PaginationComponent: PropTypes.elementType,
  /**
   * A callback fired when cell value is changed.
   */
  onCellValueChange: PropTypes.func,
  /**
   * A callback fired when selected rows changed.
   */
  onSelectedRowsChange: PropTypes.func,
  selectedRowIds: PropTypes.arrayOf(PropTypes.string),
  onExpandedChange: PropTypes.func,
};

const defaultProps = {
  id: null,
  className: null,
  style: null,
  caption: null,
  columns: [],
  hiddenColumns: [],
  groupBy: [],
  data: [],
  noDataText: 'No rows found',
  showHeader: true,
  showFilters: false,
  showFooter: false,
  doubleRowSize: false,
  allowRowSelection: false,
  actions: [],
  pageIndex: null,
  pageSize: 10,
  pageSizeOptions: [ 10, 25, 50, 100],
  minRows: 0,
  defaultSorted: [],
  defaultFiltered: [],
  expanderInHeader: false,
  getTableProps: null,
  getHeaderProps: null,
  getHeaderGroupProps: null,
  getFooterProps: null,
  getFooterGroupProps: null,
  getRowProps: null,
  getCellProps: null,
  SubComponent: null,
  PaginationComponent: Pagination,
  onCellValueChange: null,
  onSelectedRowsChange: null,
  selectedRowIds: null,
  onExpandedChange: null,
};

Table.displayName = 'Table';
Table.propTypes = propTypes;
Table.defaultProps = defaultProps;

export {
  propTypes,
  defaultProps,
  DefaultCell,
  ButtonsCell,
};

export default React.memo(Table, isEqual);
