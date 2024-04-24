/* eslint-disable react/react-in-jsx-scope, react/jsx-sort-default-props */
import React, { useMemo, useCallback } from 'react';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import GridListTileBar from '@material-ui/core/GridListTileBar';
import PropTypes from 'prop-types';
import styled from 'styled-components';

/**
 * ThumbnailsViewer display a collection of images in an organized grid.
 */
const ThumbnailsViewer = styled((props) => {
  const {
    className,
    thumbnails,
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
      const thumbIndex = newActive.indexOf(id);

      switch (true) {
        // Thumb already selected
        case thumbIndex >= 0:
          newActive.splice(thumbIndex, 1);
          break;
        // Thumb not selected and clicked in multi select mode with CTRL key pressed
        case thumbIndex === -1 && allowMultiSelect && event.ctrlKey:
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
      {thumbnails.map((thumbnail) => (
        <GridListTile
          key={thumbnail.id}
          className={`${fixedActive.includes(thumbnail.id) ? 'active' : ''}`}
          onClick={allowSelection ? emitClick(thumbnail.id) : null}
        >
          <img src={thumbnail.img} alt={thumbnail.title} />

          {(thumbnail.title || thumbnail.author) ? <GridListTileBar
            title={thumbnail.title}
            subtitle={thumbnail.author ? (<span>by: {thumbnail.author}</span>) : undefined}
                                                   /> : null}
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

ThumbnailsViewer.propTypes = {
  /**
   * Override or extend the styles applied to the component.
   */
  className: PropTypes.string,
  /**
   * Collection of images.
   */
  thumbnails: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    img: PropTypes.string,
    author: PropTypes.string,
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
   * If true, it will be possible to select thumbnails.
   */
  allowSelection: PropTypes.bool,
  /**
   * If true, it will be possible to select several thumbnails.
   */
  allowMultiSelect: PropTypes.bool,
  /**
   * A callback fired when item clicked.
   */
  onClick: PropTypes.func,
};

ThumbnailsViewer.defaultProps = {
  className: '',
  thumbnails: [],
  active: [],
  allowSelection: true,
  allowMultiSelect: false,
  onClick: null,
};

export default ThumbnailsViewer;
