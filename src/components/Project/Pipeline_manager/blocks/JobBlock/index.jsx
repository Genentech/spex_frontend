/* eslint-disable react/jsx-handler-names */
import React, { Fragment, memo } from 'react';
import styled from 'styled-components';
import IconButton from '@material-ui/core/IconButton';
// import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import ReplayIcon from '@material-ui/icons/Replay';
import PropTypes from 'prop-types';
import { Handle } from 'react-flow-renderer';
import { statusFormatter, statusColor } from '+utils/statusFormatter';
import Buttons from './components/Buttons';
import Name from './components/Name';

const iconButtonStyle = {
  padding: '3px',
};

const StatusIcon = styled(FiberManualRecordIcon)`
  position: absolute;
  top: -20px;
  right: -20px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  z-index: 1;
  border-radius: 50%;
  color: ${({ statuscolor }) => statuscolor};
  background-color: ${({ statusColor }) => statusColor};
  font-size: 130%;
`;

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const JobBlock = (props) => {
  const {
    data,
    isConnectable,
  } = props;

  const isHorizontal = data.direction === 'LR';
  const status = data?.id === 'new' ? 'New' : statusFormatter(data.status);

  return (
    <Fragment>
      <Container>
        <Name>
          {data.name && <span>{data.name}</span>}
          <StatusIcon statuscolor={statusColor(data.status)} />
        </Name>
        <Buttons>
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
              <ReplayIcon fontSize="small" />
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
