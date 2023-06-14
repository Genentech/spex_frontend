/* eslint-disable react/jsx-handler-names */
import React, { Fragment, memo } from 'react';
import IconButton from '@material-ui/core/IconButton';
// import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PropTypes from 'prop-types';
import { Handle } from 'react-flow-renderer';
import Buttons from './components/Buttons';
import Container from './components/Container';
import Name from './components/Name';

const iconButtonStyle = {
  padding: '3px',
};

const JobBlock = (props) => {
  const {
    data,
    isConnectable,
  } = props;

  const isHorizontal = data.direction === 'LR';

  return (
    <Fragment>
      <Container>
        <Buttons>
          <Name>
            {data.name && <span>{data.name}</span>}
          </Name>
          {data.onDelete && (
            <IconButton
              style={iconButtonStyle}
              disabled={data.id === 'new'}
              onClick={() => data.onDelete(data)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}

          {data.onRestart && (
            <IconButton
              style={iconButtonStyle}
              disabled={data.id === 'new'}
              onClick={() => data.onRestart(data)}
            >
              <PlayArrowIcon fontSize="small" />
            </IconButton>
          )}

        </Buttons>
      </Container>

      <Handle
        type="target"
        position={isHorizontal ? 'left' : 'top'}
        isConnectable={isConnectable}
      />

      <Handle
        type="source"
        position={isHorizontal ? 'right' : 'bottom'}
        isConnectable={isConnectable}
      />
    </Fragment>
  );
};

JobBlock.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    value: PropTypes.string,
    direction: PropTypes.string,
    onAdd: PropTypes.func,
    onDelete: PropTypes.func,
    onRestart: PropTypes.func,
  }).isRequired,
  isConnectable: PropTypes.bool.isRequired,
};

export default memo(JobBlock);
