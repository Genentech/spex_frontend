/* eslint-disable react/jsx-sort-default-props */
import React, { useEffect } from 'react';
import Card from '@material-ui/core/Card';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { actions as omeroActions, selectors as omeroSelectors } from '@/redux/modules/omero';
import ImageViewer from '+components/ImageViewer';
import NoData from '+components/NoData';
import { ScrollBarMixin } from '+components/ScrollBar';

const onNoop = () => {};

const include = (arr, val) => arr.some((el) => el.id === val.id);

/**
 * A transfer list (or "shuttle") enables the user to move one or more list items between lists.
 */
const ImagePicker = styled((props) => {
  const {
    className,
    options,
    input,
    meta,
    area,
    editable,
    onAreaChange,
  } = props;

  const dispatch = useDispatch();
  const invalid = meta.error && meta.touched;
  const value = input?.value || props.value;
  const onChange = input.onChange || props.onChange;
  const imageId = value?.[0]?.id;
  const imageDetails = useSelector(omeroSelectors.getImageDetails(imageId));

  useEffect(
    () => {
      if (!imageId) {
        return;
      }
      dispatch(omeroActions.fetchImageDetails(imageId));
      return () => {
        dispatch(omeroActions.clearImageDetails(imageId));
      };
    },
    [imageId, dispatch],
  );

  return (
    <Grid
      className={classNames('image-picker', className || '', { invalid })}
      spacing={3}
      justify="center"
      alignItems="center"
      container
    >
      <Grid className="list" item>
        <Card>
          <List dense component="div" role="list">
            {options.map((el) => (
              <ListItem
                key={el.id}
                role="listitem"
                selected={include(value, el)}
                onClick={() => onChange([el])}
                button
              >
                {el.img ? <ListItemIcon><img src={el.img} alt={el.title || 'Image'} /></ListItemIcon> : null}

                {el.title ? <ListItemText id={`image-picker-item-${el.id}-label`} primary={el.title} /> : null}
              </ListItem>
            ))}

            <ListItem />
          </List>
        </Card>
      </Grid>

      <Grid className="image" item>
        {!imageDetails && <NoData>No image to display</NoData>}

        {imageDetails ? <ImageViewer
          data={imageDetails}
          value={area}
          editable={editable}
          onChange={onAreaChange}
                        /> : null}
      </Grid>

      {meta.error && meta.touched ? <Grid className="error" xs={12} item>
        <p className="MuiFormHelperText-root MuiFormHelperText-contained Mui-error">{meta.error}</p>
      </Grid> : null}
    </Grid>
  );
})`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  
  .list {
    width: 100%;
    height: 100%;
    padding: 0;
    overflow: hidden;
    max-width: 140px !important;
    flex-basis: 140px !important;

    .MuiCard-root {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      max-height: 100%;
      overflow: hidden;
    }

    .MuiList-root {
      overflow-y: auto;
      height: 100%;
      max-height: 100%;

      ${ScrollBarMixin};

      .MuiListItem-root {
        padding: 6px 0;
        justify-content: center;
      }
      
      .MuiListItemIcon-root {
        justify-content: center;
      }
    }
  }
  
  .image {
    width: 100%;
    height: 100%;
    padding: 0;
    overflow: hidden;
    margin-left: 12px;
    max-width: calc(100% - 140px - 12px) !important;
    flex-basis: calc(100% - 140px - 12px) !important;

    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #ccc;  
    
    border-radius: 4px;
  }

  .image:only-child {
    margin-left: unset;
    max-width: 100% !important;
    flex-basis: 100% !important;
  }
  
  &.invalid {
    border: 2px solid #f44336;
    border-radius: 6px;
  }

  .error {
    padding: unset;
  }
`;

ImagePicker.propTypes = {
  className: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.shape({})),
  input: PropTypes.shape({
    value: PropTypes.arrayOf(PropTypes.shape({})),
    onChange: PropTypes.func,
  }),
  value: PropTypes.arrayOf(PropTypes.shape({})),
  area: PropTypes.arrayOf(PropTypes.shape({ x: PropTypes.number, y: PropTypes.number })),
  editable: PropTypes.bool,
  onChange: PropTypes.func,
  onAreaChange: PropTypes.func,
};

ImagePicker.defaultProps = {
  className: '',
  options: [],
  input: null,
  value: [],
  area: null,
  editable: false,
  onChange: onNoop,
  onAreaChange: null,
};

export default ImagePicker;
