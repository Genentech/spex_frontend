import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const RecourseCell = styled(({ className, name, omeroIds }) => (
  <div className={classNames(className, 'recourse-cell')}>
    <div className="recourse-name">
      <span className="recourse-name__label">Name:</span>

      <span className="recourse-name__value">{name}</span>
    </div>

    <div className="recourse-omeroIds">
      <span className="recourse-omeroIds__label">Omero Image IDs:</span>

      <span className="recourse-omeroIds__value">{omeroIds}</span>
    </div>
  </div>
))`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  .recourse-name {
    display: flex;
    &__label {
      font-weight: bold;
      margin-right: 4px;
    }
  }

  .recourse-omeroIds {
    display: flex;
    &__label {
      font-weight: bold;
      margin-right: 4px;
    }
  }
`;

RecourseCell.propTypes = {
  id: PropTypes.string.isRequired,
  omeroIds: PropTypes.arrayOf(PropTypes.string),
};

RecourseCell.defaultProps = {
  omeroIds: [],
};

export default RecourseCell;
