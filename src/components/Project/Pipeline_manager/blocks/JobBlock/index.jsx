/* eslint-disable react/jsx-handler-names */
import React, { Fragment, memo } from 'react';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import PlayArrowIcon from '@material-ui/icons/PlayCircleOutline';
import PropTypes from 'prop-types';
import { Handle } from 'react-flow-renderer';
import styled from 'styled-components';
import { statusColor } from '+utils/statusFormatter';
import Name from './components/Name';

const iconButtonStyle = {
  padding: '1px',
};

const StatusIcon = styled(FiberManualRecordIcon)`
  position: absolute;
  top: -15px;
  right: -15px;
  border: 1px solid rgba(0, 0, 0, 0.2) !important;;
  z-index: 1;
  border-radius: 50%;
  color: ${({ statuscolor }) => statuscolor};
  background:  ${({ statuscolor }) => statuscolor};
  font-size: 130%;
`;

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const JobBlock = (props) => {
  const {
    data,
    isConnectable,
  } = props;

  const isHorizontal = data.direction === 'LR';

  return (
    <Fragment>
      <Container>
        <Name>
          {data.name && <span>{data.name}</span>}
          <StatusIcon statuscolor={statusColor(data.status)} />
        </Name>
        <ButtonGroup>
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

        </ButtonGroup>
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
