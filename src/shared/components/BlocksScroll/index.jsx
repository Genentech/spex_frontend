import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, Typography } from '@material-ui/core';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';

import PropTypes from 'prop-types';
import styled from 'styled-components';

const BlocksScroll = styled((props) => {
  const {
    items,
    active,
    allowMultiSelect,
    onClick,
  } = props;

  const fixedActive = useMemo(
    () => Array.isArray(active) ? active : [active].filter(Boolean),
    [active],
  );

  const emitClick = useCallback(
    (id) => (event) => {
      if (!onClick) {
        return;
      }

      let newActive = [...fixedActive];
      const itemIndex = newActive.indexOf(id);

      switch (true) {
        case itemIndex >= 0:
          newActive.splice(itemIndex, 1);
          break;
        case itemIndex === -1 && allowMultiSelect && event.ctrlKey:
          newActive.push(id);
          break;
        default:
          newActive = [id];
          break;
      }

      onClick(newActive);
    },
    [fixedActive, allowMultiSelect, onClick],
  );

  const smallerTextStyle = {
    fontSize: '80%',
    wordWrap: 'break-word',
    overflow: 'after-ellipsis',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
  };

  const cardContentStyle = {
    paddingLeft: '5px',
    paddingRight: '5px',
    paddingTop: '15px',
  };

  return (
    <GridList cols={5}>
      {items.map((item) => (
        <GridListTile
          key={item.script_path}
          onClick={emitClick(item)}
          style={{
            border: fixedActive.includes(item) ? '0.188em solid red ' : '0.188em solid transparent ',
            width: '70px', height: '70px', overflowY: 'auto', padding: '1px',
          }}
        >
          <Card>
            <CardContent style={cardContentStyle}>
              <Typography style={smallerTextStyle}>
                {item.script_path}
              </Typography>
            </CardContent>
          </Card>
        </GridListTile>
      ))}
    </GridList>
  );
})`
  --size: 1;

  justify-content: ${(props) => props.$center ? 'center' : null};
  align-items: ${(props) => props.$center ? 'center' : null};
`;

BlocksScroll.propTypes = {
  className: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.shape({})),
  active: PropTypes.arrayOf(PropTypes.shape({})),
  allowSelection: PropTypes.bool,
  allowMultiSelect: PropTypes.bool,
  onClick: PropTypes.func,
};

BlocksScroll.defaultProps = {
  className: '',
  items: [],
  active: [],
  allowSelection: true,
  allowMultiSelect: false,
  onClick: null,
};

export default BlocksScroll;
