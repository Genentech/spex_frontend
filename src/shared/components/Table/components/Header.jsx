/* eslint-disable react/jsx-sort-default-props */
import React, { Fragment } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { getProps } from '../utils';

const Header = (props) => {
    const {
        headerGroups,
        getHeaderProps,
        getHeaderGroupProps,
        getToggleAllRowsExpandedProps,
        expanderInHeader,
    } = props;

    const [ lastHeaderGroup ] = headerGroups.slice(-1);
    const hasFilters = lastHeaderGroup?.headers.some((item) => item.canFilter);

    return (
      <Fragment>
        {headerGroups.map((headerGroup) => {
                const { key, ...headerGroupProps } = headerGroup.getHeaderGroupProps(getHeaderGroupProps || {});

                return (
                  <div className={`rt-thead -header${headerGroup === lastHeaderGroup ? '' : 'Groups'}`} key={key}>
                    <div className='rt-tr' {...headerGroupProps}>
                      {headerGroup.headers.map((column) => {
                                const columnProps = column.getHeaderProps(getProps([
                                    {
                                        className: classNames(
                                            'rt-th rt-resizable-header',
                                            {
                                                sortable: column.canSort,
                                                '-sort-desc': column.isSorted && column.isSortedDesc,
                                                '-sort-asc': column.isSorted && !column.isSortedDesc,
                                            },
                                        ),
                                    },
                                    expanderInHeader && column.expander ? getToggleAllRowsExpandedProps() : {},
                                    getHeaderProps,
                                    column.getProps,
                                ]));

                                const canResize = !column.headers && column.canResize;

                                return (
                                    // eslint-disable-next-line react/jsx-key
                                  <div {...columnProps}>
                                    <div
                                      className='rt-resizable-header-content'
                                      {...(column.canSort && column.getSortByToggleProps())}
                                    >
                                      {column.render('Header')}
                                    </div>

                                    {canResize ? <div className='rt-resizer' {...column.getResizerProps()} /> : null}
                                  </div>
                                );
                            })}
                    </div>
                  </div>
                );
            })}

        {hasFilters ? <div className='rt-thead -filters'>
          <div className='rt-tr' {...lastHeaderGroup.getHeaderGroupProps()}>
            {lastHeaderGroup.headers.map((column) => (
                            // eslint-disable-next-line react/jsx-key
              <div
                {...column.getHeaderProps(getProps([
                                    { className: 'rt-th' },
                                    getHeaderProps,
                                    column.getProps,
                                ]))}
              >
                {column.canFilter ? column.render('Filter') : null}
              </div>
                        ))}
          </div>
        </div> : null}
      </Fragment>
    );
};

Header.propTypes = {
    headerGroups: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    getToggleAllRowsExpandedProps: PropTypes.func.isRequired,
    getHeaderProps: PropTypes.func,
    getHeaderGroupProps: PropTypes.func,
    expanderInHeader: PropTypes.bool,
};

Header.defaultProps = {
    getHeaderProps: null,
    getHeaderGroupProps: null,
    expanderInHeader: false,
};

export default Header;
