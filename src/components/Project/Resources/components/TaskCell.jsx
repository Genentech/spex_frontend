import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const maxCsvDataSize = 5;

const TaskCell = styled(({ className, name, omeroId, csvdata }) => (
  <div className={classNames(className, 'task-cell')}>
    <div className="task-name">
      <span className="task-name__label">Name:</span>

      <span className="task-name__value">{name}</span>
    </div>

    <div className="task-omeroId">
      <span className="task-omeroId__label">Omero Image ID:</span>

      <span className="task-omeroId__value">{omeroId}</span>
    </div>

    <div className="task-csvdata">
      <span className="task-csvdata__label">CSV Data:</span>

      <span className="task-csvdata__value">
        {/* eslint-disable-next-line react/no-array-index-key */}
        {csvdata.slice(0, maxCsvDataSize).map((row, i) => (<span key={i} className="task-csvdata__row">{i + 1}. {row}</span>))}

        {csvdata.length > maxCsvDataSize && (<span className="task-csvdata__row">...</span>)}
      </span>
    </div>
  </div>
))`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  .task-name {
    display: flex;
    &__label {
      font-weight: bold;
      margin-right: 4px;
    }
  }

  .task-omeroId {
    display: flex;
    &__label {
      font-weight: bold;
      margin-right: 4px;
    }
  }

  .task-csvdata {
    display: flex;
    flex-direction: column;
    &__label {
      font-weight: bold;
    }
    &__value {
      display: flex;
      flex-direction: column;
      flex-wrap: nowrap;
    }
    &__row {
      white-space: nowrap;
    }
  }
`;

TaskCell.propTypes = {
  id: PropTypes.string.isRequired,
  omeroId: PropTypes.string,
  csvdata: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
};

TaskCell.defaultProps = {
  csvdata: [],
  omeroId: '',
};

export default TaskCell;
