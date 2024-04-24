/* eslint-disable react/jsx-sort-default-props */
import React, { useState, useMemo, useCallback } from 'react';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import Button, { ButtonSizes } from '+components/Button';
import Checkbox from '+components/Checkbox';
import { ScrollBarMixin } from '+components/ScrollBar';

const not = (a, b) => {
  if (!Array.isArray(a)) return [];
  const fixedB = b.map((el) => el.id);
  return a.filter((value) => fixedB.indexOf(value.id) === -1);
};


const onNoop = () => {
};

const SingleTransferList = styled((props) => {
  const {
    className,
    options,
    input,
    leftTitle,
    rightTitle,
    // eslint-disable-next-line no-unused-vars
    file_names,
    meta,
  } = props;

  const invalid = meta.error && meta.touched;
  const initialValue = props.file_names || props.value;
  const onChange = input.onChange || props.onChange;
  const [checked, setChecked] = useState(null);
  const [currentValue, setCurrentValue] = useState(initialValue);

  const fixedValue = useMemo(
    () => {
      if (!options?.length) {
        return [];
      }
      const arr = Array.isArray(currentValue) ? currentValue : [currentValue];
      return arr
        .map((val) => options.find((item) => item.title === (val.title || val)))
        .filter(Boolean)
        .map((item) => {
          const { disabled, ...rest } = item;
          return rest;
        });
    },
    [options, currentValue],
  );

  const fixedOptions = useMemo(
    () => not(options, fixedValue),
    [options, fixedValue],
  );

  const onCheckedRight = useCallback(
    () => {
      setCurrentValue(checked);
      onChange(checked);
      setChecked(null);
    },
    [checked, onChange],
  );

  const onToggle = useCallback(
    (newValue) => () => {
      if (checked && checked.title === newValue.title) {
        setChecked(null);
      } else {
        setChecked(newValue);
      }
    },
    [checked],
  );

  const customList = useCallback(
    (title, items) => (
      <Card>
        <CardHeader
          title={title}
        />

        <Divider />

        <List dense component="div" role="list">
          {items.map((item) => (
            <ListItem
              key={item.id}
              role="listitem"
              button
              onClick={onToggle(item)}
              disabled={item.disabled}
            >
              <ListItemIcon>
                <Checkbox
                  checked={checked?.id === item.id}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItemIcon>

              {item.img ? <ListItemIcon>
                <img src={item.img} alt={item.title || 'Image'} />
              </ListItemIcon> : null}

              {(item.title || item.description) ? <ListItemText
                primary={item.title}
                secondary={item.description}
                                                  /> : null}
            </ListItem>
          ))}

          <ListItem />
        </List>
      </Card>
    ),
    [checked, onToggle],
  );

  return (
    <Grid
      className={classNames('transfer-list', className || '', { invalid })}
      spacing={3}
      justify="center"
      alignItems="center"
      container
    >
      <Grid className={classNames('list', 'list-left')} item>
        {customList(leftTitle, fixedOptions)}
      </Grid>

      <Grid className="buttons-container" item>
        <Grid
          direction="column"
          alignItems="center"
          container
        >
          <Button
            variant="outlined"
            size={ButtonSizes.small}
            onClick={onCheckedRight}
            disabled={!checked}
            aria-label="move selected right"
          >
            &gt;
          </Button>
        </Grid>
      </Grid>

      <Grid className={classNames('list', 'list-right')} item>
        {customList(rightTitle, fixedValue)}

        {invalid ? <p className="MuiFormHelperText-root MuiFormHelperText-contained Mui-error">{meta.error}</p> : null}
      </Grid>
    </Grid>
  );
})`
  width: 100%;
height: 100%;
  overflow: hidden;

  .list-left {
    max-width: calc(50% - 45px) !important;
    flex-basis: calc(50% - 45px) !important;
  }

  .list-right {
    position: relative;
    max-width: calc(50% - 45px) !important;
    flex-basis: calc(50% - 45px) !important;
  }

  .list {
    width: 100%;
    height: 100%;
    padding: 0;
    overflow: hidden;

    .MuiCard-root {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      max-height: 100%;
      overflow: hidden;

      .MuiCardHeader-root {
        padding: 10px;

        .MuiCardHeader-content {
          display: flex;
          flex-direction: row;

          span {
            white-space: nowrap;
          }

          span + span {
            margin-left: auto;
          }
        }
      }
    }

    .MuiList-root {
      overflow-y: auto;
      height: 100%;
      max-height: 100%;

      ${ScrollBarMixin};

      .MuiListItem-root {
        padding: 2px 10px;
      }

      .MuiListItemIcon-root {
        min-width: unset;
        margin-right: 16px;
      }
    }
  }

  .MuiGrid-zeroMinWidth {
    overflow: hidden;
    min-width: 60px;
    max-width: 60px;
    padding: 4px;
  }

  .buttons-container {
    width: 60px;

    ${Button} + ${Button} {
      margin-top: 8px;
    }

    ${Button} {
      min-width: unset;
      width: 100%;
    }
  }

  &.invalid .list-right {
    border: 1px solid #f44336;
    border-radius: 4px;
  }

  .Mui-error {
    position: absolute;
    top: 50%;
    right: 50%;
    transform: translateX(50%);
    color: #f44336;
  }
`;

SingleTransferList.propTypes = {
  className: PropTypes.string,
  multiple: PropTypes.bool,
  options: PropTypes.arrayOf(PropTypes.shape({})),
  input: PropTypes.shape({
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({}),
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.arrayOf(PropTypes.shape({})),
    ]),
    onChange: PropTypes.func,
  }),
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({}),
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.arrayOf(PropTypes.shape({})),
  ]),
  leftTitle: PropTypes.string,
  rightTitle: PropTypes.string,
  not: PropTypes.func,
  intersection: PropTypes.func,
  union: PropTypes.func,
  onChange: PropTypes.func,
};

SingleTransferList.defaultProps = {
  className: '',
  multiple: false,
  options: [],
  input: {},
  value: [],
  file_names: [],
  leftTitle: 'Choices',
  rightTitle: 'Chosen',
  not: PropTypes.func,
  intersection: PropTypes.func,
  union: PropTypes.func,
  onChange: onNoop,
};

export default SingleTransferList;
