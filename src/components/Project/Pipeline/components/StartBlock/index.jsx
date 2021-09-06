/* eslint-disable react/jsx-handler-names */
import React, { memo } from 'react';
import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/Add';
import PropTypes from 'prop-types';
import { Handle } from 'react-flow-renderer';

import Container from './components/Container';

const StartBlock = (props) => {
  const {
    data,
    isConnectable,
  } = props;

  return (
    <Container>
      <IconButton onClick={() => data.onAdd(data)}>
        <AddIcon fontSize="small" />
      </IconButton>

      <Handle
        type="source"
        position="right"
        isConnectable={isConnectable}
      />
    </Container>
  );
};

StartBlock.propTypes = {
  data: PropTypes.shape({
    value: PropTypes.string,
    onAdd: PropTypes.func,
  }).isRequired,
  isConnectable: PropTypes.bool.isRequired,
};

export default memo(StartBlock);
