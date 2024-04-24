import React from 'react';
import Checkbox from '@material-ui/core/Checkbox';
import PropTypes from 'prop-types';

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
    [PropTypes.string]: PropTypes.bool,
  }).isRequired,
};

CheckboxCell.displayName = 'CheckboxCell';

export default CheckboxCell;
