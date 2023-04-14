import React from 'react';
import PropTypes from 'prop-types';
import Checkbox from '@material-ui/core/Checkbox';

const CheckboxCell = ({ value, onFileSelect, selectedFiles }) => {
  return (
    <Checkbox
      checked={!!selectedFiles[value]}
      onChange={() => onFileSelect(value)}
    />
  );
};

CheckboxCell.propTypes = {
  value: PropTypes.string.isRequired,
  onFileSelect: PropTypes.func.isRequired,
  selectedFiles: PropTypes.shape({
    [PropTypes.string]: PropTypes.bool
  }).isRequired,
};

CheckboxCell.displayName = 'CheckboxCell';

export default CheckboxCell;
