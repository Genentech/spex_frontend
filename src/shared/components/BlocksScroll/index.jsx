/* eslint-disable react/react-in-jsx-scope, react/jsx-sort-default-props */
import React, { useMemo, useCallback } from 'react';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import GridListTileBar from '@material-ui/core/GridListTileBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import PropTypes from 'prop-types';
import styled from 'styled-components';

/**
 * BLocks viewer display a collection of images in an organized grid.
 */
const BlocksScroll = styled((props) => {
  const {
    className,
    items,
    active,
    allowSelection,
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
        // Iten already selected
        case itemIndex >= 0:
          newActive.splice(itemIndex, 1);
          break;
        // Item not selected and clicked in multi select mode with CTRL key pressed
        case itemIndex === -1 && allowMultiSelect && event.ctrlKey:
          newActive.push(id);
          break;
        // Other cases
        default:
          newActive = [id];
          break;
      }

      onClick(newActive);
    },
    [fixedActive, allowMultiSelect, onClick],
  );

  return (
    <GridList className={className}>
      {items.map((item) => (
        <GridListTile
          key={item.script_path}
          className={`${fixedActive.includes(item.script_path) ? 'active' : ''}`}
          onClick={allowSelection ? emitClick(item.script_path) : null}
        >
          <Box color="text.primary" clone>
            <Button> {item.script_path} </Button>
          </Box>
          {(item.script_path) && (
            <GridListTileBar
              title={item.script_path}
              subtitle={undefined}
            />
          )}
        </GridListTile>
      ))}
    </GridList>
  );
})`
  --size: ${(props) => (props.$size || 1)};
  
  justify-content: ${(props) => props.$center ? 'center' : null};
  align-items: ${(props) => props.$center ? 'center' : null};
  
  .MuiGridListTile-root {
    width: calc(var(--size) * 6.250em) !important;
    height: calc(var(--size) * 6.250em) !important;

    .MuiGridListTile-tile {
      border: 0.188em solid transparent;
      cursor: pointer;
    }

    &.active .MuiGridListTile-tile {
      border-color: red;
    }
  }

  .MuiGridListTileBar-root {
    height: 30%;
    background-color: rgba(255, 255, 255, 0.24);

    .MuiGridListTileBar-titleWrap {
      margin: 0 0.188em;
    }

    .MuiGridListTileBar-title {
      font-size: calc(var(--size) * 0.563em);
    }
  }
`;

BlocksScroll.propTypes = {
  /**
   * Override or extend the styles applied to the component.
   */
  className: PropTypes.string,
  /**
   * Collection of images.
   */
  Items: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    script_path: PropTypes.string,
  })),
  /**
   * Active image ids.
   */
  active: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  ]),
  /**
   * If true, it will be possible to select items
   */
  allowSelection: PropTypes.bool,
  /**
   * If true, it will be possible to select several itemsnails.
   */
  allowMultiSelect: PropTypes.bool,
  /**
   * A callback fired when item clicked.
   */
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
