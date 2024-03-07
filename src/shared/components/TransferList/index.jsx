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
  const fixedB = b.map((el) => el.id);
  return a.filter((value) => fixedB.indexOf(value.id) === -1);
};

const intersection = (a, b) => {
  const fixedB = b.map((el) => el.id);
  return a.filter((value) => fixedB.indexOf(value.id) !== -1);
};

const union = (a, b) => ([...a, ...not(b, a)]);

const onNoop = () => {
};

/**
 * A transfer list (or "shuttle") enables the user to move one or more list items between lists.
 */
const TransferList = styled((props) => {
  const {
    className,
    options,
    input,
    leftTitle,
    rightTitle,
    meta,
  } = props;

  const invalid = meta.error && meta.touched;
  const value = input?.value || props.value;
  const onChange = input.onChange || props.onChange;

  const [checked, setChecked] = useState([]);

  const fixedValue = useMemo(
    () => {
      const arr = Array.isArray(value) ? value : [value];
      if (!options?.length) {
        return arr;
      }
      return arr.map((val) => {
        const foundedOption = options.find((item) => item.id === (val.id || val));
        if (foundedOption) {
          const { disabled, ...rest } = foundedOption;
          return rest;
        }
        return val.id ? val : { id: val };
      });
    },
    [options, value],
  );

  const fixedOptions = useMemo(
    () => not(options, fixedValue),
    [options, fixedValue],
  );

  const leftChecked = useMemo(
    () => intersection(checked, fixedOptions),
    [checked, fixedOptions],
  );

  const rightChecked = useMemo(
    () => intersection(checked, fixedValue),
    [checked, fixedValue],
  );

  const onCheckedLeft = useCallback(
    () => {
      onChange(not(fixedValue, rightChecked));
      setChecked(not(checked, rightChecked));
    },
    [checked, onChange, fixedValue, rightChecked],
  );

  const onCheckedRight = useCallback(
    () => {
      onChange([
        ...fixedValue,
        ...leftChecked,
      ]);
      setChecked(not(checked, leftChecked));
    },
    [checked, leftChecked, onChange, fixedValue],
  );

  const numberOfChecked = useCallback(
    (items) => intersection(checked, items).length,
    [checked],
  );

  const onToggle = useCallback(
    (newValue) => () => {
      const currentIndex = checked.indexOf(newValue);
      const newChecked = [...checked];

      if (currentIndex === -1) {
        newChecked.push(newValue);
      } else {
        newChecked.splice(currentIndex, 1);
      }

      setChecked(newChecked);
    },
    [checked],
  );

  const onToggleAll = useCallback(
    (items) => () => {
      if (numberOfChecked(items) === items.length) {
        setChecked(not(checked, items));
      } else {
        setChecked(union(checked, items));
      }
    },
    [checked, numberOfChecked],
  );

  const customList = useCallback(
    (title, items) => (
      <Card>
        <CardHeader
          avatar={
            <Checkbox
              onClick={onToggleAll(items)}
              checked={numberOfChecked(items) === items.length && items.length !== 0}
              indeterminate={numberOfChecked(items) !== items.length && numberOfChecked(items) !== 0}
              disabled={items.length === 0}
              inputProps={{ 'aria-label': 'all items selected' }}
            />
          }
          title={title}
          subheader={`${numberOfChecked(items)}/${items.length}`}
        />
        <Divider />
        <List dense component="div" role="list">
          {items.map((item, index) => (
            <ListItem
              // eslint-disable-next-line react/no-array-index-key
              key={`${item.id}-${index}`}
              role="listitem"
              button
              onClick={onToggle(item)}
              disabled={item.disabled}
            >
              <ListItemIcon>
                <Checkbox
                  checked={checked.indexOf(item) !== -1}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItemIcon>
              {item.img && (
                <ListItemIcon>
                  <img src={item.img} alt={item.title || 'Image'} />
                </ListItemIcon>
              )}
              {(item.title || item.description) && (
                <ListItemText
                  primary={item.title}
                  secondary={item.description}
                />
              )}
            </ListItem>
          ))}
          <ListItem />
        </List>
      </Card>
    ),
    [checked, numberOfChecked, onToggle, onToggleAll],
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
            disabled={leftChecked.length === 0}
            aria-label="move selected right"
          >
            &gt;
          </Button>
          <Button
            variant="outlined"
            size={ButtonSizes.small}
            onClick={onCheckedLeft}
            disabled={rightChecked.length === 0}
            aria-label="move selected left"
          >
            &lt;
          </Button>
        </Grid>
      </Grid>

      <Grid className={classNames('list', 'list-right')} item>
        {customList(rightTitle, fixedValue)}
        {invalid && <p className="MuiFormHelperText-root MuiFormHelperText-contained Mui-error">{meta.error}</p>}
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

TransferList.propTypes = {
  className: PropTypes.string,
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

TransferList.defaultProps = {
  className: '',
  options: [],
  input: {},
  value: [],
  leftTitle: 'Choices',
  rightTitle: 'Chosen',
  not: PropTypes.func,
  intersection: PropTypes.func,
  union: PropTypes.func,
  onChange: onNoop,
};

export default TransferList;
