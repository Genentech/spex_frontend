/* eslint-disable react/jsx-sort-default-props */
import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { getProps } from '../utils';
import NoDataContainer from './NoDataContainer';

const Body = (props) => {
    const {
        getTableBodyProps,
        getRowProps,
        getCellProps,
        prepareRow,
        rows,
        SubComponent,
        fakeRows,
        headerGroups,
        doubleLineSpacing,
        noData,
    } = props;

    const [ lastHeaderGroup ] = headerGroups.slice(-1);

    const rowGroupClassName = classNames('rt-tr-group', { double: doubleLineSpacing });

    return (
      <div className='rt-tbody' {...getTableBodyProps()}>
        {rows.map((row, index) => {
                prepareRow(row);

                const { key, ...rowProps } = row.getRowProps(getProps([
                    { className: classNames('rt-tr', { '-odd': !(index % 2) }) },
                    getRowProps,
                ]));

                return (
                  <div className={rowGroupClassName} {...getTableBodyProps()} key={key}>
                    <div {...rowProps}>
                      {row.cells.map((cell) => {
                                const isExpander = cell.column.expander && (SubComponent || row.subRows?.length > 1);

                                const cellProps = cell.getCellProps(getProps([
                                    { className: classNames('rt-td', { 'rt-expandable': isExpander }) },
                                    isExpander ? row.getToggleRowExpandedProps() : {},
                                    getCellProps,
                                    cell.column.getCellProps,
                                ]));

                                let render;
                                switch (true) {
                                    case Boolean(cell.isAggregated):
                                        render = cell.column.expander ? cell.render('Cell') : cell.render('Aggregated');
                                        break;
                                    case cell.isPlaceholder:
                                        render = null;
                                        break;
                                    case cell.isGrouped:
                                    default:
                                        render = cell.render('Cell');
                                        break;
                                }

                                return (
                                    // eslint-disable-next-line react/jsx-key
                                  <div {...cellProps}>
                                    {render}
                                  </div>
                                );
                            })}
                    </div>

                    {row.isExpanded && SubComponent ? <SubComponent {...row} /> : null}
                  </div>
                );
            })}

        {fakeRows.map((_, i) => (
          <div className={rowGroupClassName} {...getTableBodyProps()} key={`key_dummyRow_${_}`}>
            <div className={`rt-tr -padRow ${(rows.length + i) % 2 ? '' : '-odd'}`}>
              {lastHeaderGroup?.headers.map((column) => (
                            // eslint-disable-next-line react/jsx-key
                <div
                  {...column.getHeaderProps(getProps([
                                    { className: 'rt-td' },
                                    getCellProps,
                                    column.getCellProps,
                                ]))}
                />
                        ))}
            </div>
          </div>
            ))}

        {noData && !rows?.length ? <NoDataContainer className='rt-noData'>{noData}</NoDataContainer> : null}
      </div>
    );
};

Body.propTypes = {
    fakeRows: PropTypes.arrayOf(PropTypes.number).isRequired,
    getTableBodyProps: PropTypes.func.isRequired,
    prepareRow: PropTypes.func.isRequired,
    rows: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    headerGroups: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    getRowProps: PropTypes.func,
    getCellProps: PropTypes.func,
    doubleLineSpacing: PropTypes.bool,
    SubComponent: PropTypes.elementType,
    noData: PropTypes.string,
};

Body.defaultProps = {
    getRowProps: null,
    getCellProps: null,
    SubComponent: null,
    doubleLineSpacing: false,
    noData: null,
};

export default Body;
