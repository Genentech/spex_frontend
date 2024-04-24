import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

const BooleanColumnFilter = (labels) => {
    const {
        true: trueLabel = 'True',
        false: falseLabel = 'False',
    } = labels || {};

    const Component = (props) => {
        const { column: { filterValue, setFilter } } = props;

        const onChange = useCallback(
            (event) => setFilter(event.target.value),
            [ setFilter ],
        );

        return (
            // eslint-disable-next-line jsx-a11y/no-onchange
          <select
            onChange={onChange}
            style={{ width: '100%', height: '100%' }}
            value={filterValue ?? 'all'}
          >
            {/* eslint-disable-next-line react/jsx-no-literals */}
            <option value='all' aria-label='All'>All</option>

            <option value='true'>{trueLabel}</option>

            <option value='false'>{falseLabel}</option>
          </select>
        );
    };

    Component.propTypes = {
        column: PropTypes.shape({
            filterValue: PropTypes.string,
            setFilter: PropTypes.func,
        }).isRequired,
    };

    return Component;
};

export default BooleanColumnFilter;
