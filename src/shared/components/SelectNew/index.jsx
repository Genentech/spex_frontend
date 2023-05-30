import React, { useMemo, useCallback, useState } from 'react';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import ShowAllIcon from '@material-ui/icons/ExpandMore';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import Autocomplete from '@material-ui/lab/Autocomplete';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const Option = styled.div`
  :before {
    content: '---';
    margin-right: 10px;
    color: #${(props) => props.$color} !important;
    background-color: #${(props) => props.$color} !important;
  }
`;

const getOptionLabel = (option) => option.label;

const renderOption = (option) => (
  <Option key={option.value} $color={option.color}>
    {option.label}
  </Option>
);

const SelectNew = (props) => {
  const {
    options,
    onlyOneValue,
    input,
    meta,
    onSelectedChannelsChange,
    ...tail
  } = props;

  const showError = ((meta.submitError && !meta.dirtySinceLastSubmit) || meta.error) && meta.touched;
  const onChange = input.onChange || props.onChange;

  const [selectedChannels, setSelectedChannels] = useState([]);
  const [showAll, setShowAll] = useState(false);

  const fixedValue = useMemo(
    () => {
      let value = options.length ? input?.value ?? props.value : [];
      value = value == null || value === '' ? [] : value;
      value = (Array.isArray(value) ? value : [value]).map((val) => options.find((opt) => opt.value === val) || { value: val, label: val });
      return onlyOneValue ? value[0] || null : value;
    },
    [input?.value, options, props.value, onlyOneValue],
  );

  const doChange = useCallback(
    (_, val) => {
      onChange?.(onlyOneValue ? val?.value : val?.map((el) => el.value));
      setSelectedChannels(val);
      if (typeof onSelectedChannelsChange === 'function') {
        onSelectedChannelsChange(val);
      }
    },
    [onChange, onlyOneValue, onSelectedChannelsChange],
  );

  const handleSelectAll = useCallback(() => {
    if (!onlyOneValue) {
      const allValues = options.map((option) => option.value);
      onChange(allValues);
      setSelectedChannels(allValues);
    }
  }, [onChange, onlyOneValue, options]);

  const handleShowAllToggle = useCallback(() => {
    setShowAll((prevShowAll) => !prevShowAll);
  }, []);

  const displayedOptions = showAll ? options : options.slice(0, 3);

  const renderInput = useCallback(
    (params) => (
      <TextField
        {...params}
        InputProps={{
          ...params.InputProps,
          endAdornment: (
            <React.Fragment>
              {!onlyOneValue && (
                <IconButton onClick={handleSelectAll} size="small">
                  <SelectAllIcon />
                </IconButton>
              )}
              <IconButton onClick={handleShowAllToggle} size="small">
                <ShowAllIcon />
              </IconButton>
              {params.InputProps.endAdornment}
            </React.Fragment>
          ),
        }}
        helperText={showError ? meta.error || meta.submitError : undefined}
        error={showError}
        label={tail.label || ''}
        variant="outlined"
      />
    ),
    [tail.label, showError, meta.error, meta.submitError, onlyOneValue, handleSelectAll, handleShowAllToggle],
  );

  return (
    <Autocomplete
      multiple={!onlyOneValue}
      {...tail}
      renderInput={renderInput}
      getOptionLabel={getOptionLabel}
      renderOption={renderOption}
      options={displayedOptions}
      disableCloseOnSelect
      value={fixedValue}
      onChange={doChange}
      clearOnEscape={false}
    />
  );
};

SelectNew.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({})),
  input: PropTypes.shape({
    value: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.arrayOf(PropTypes.number),
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string),
    ]),
    onChange: PropTypes.func,
  }),
  meta: PropTypes.shape({
    error: PropTypes.string,
    touched: PropTypes.bool,
    submitError: PropTypes.string,
    dirtySinceLastSubmit: PropTypes.bool,
  }),
  value: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.number),
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  onChange: PropTypes.func,
  onlyOneValue: PropTypes.bool,
  onSelectedChannelsChange: PropTypes.func,
};

SelectNew.defaultProps = {
  options: [],
  input: {},
  meta: {},
  value: [],
  onChange: null,
  onlyOneValue: false,
  onSelectedChannelsChange: null,
};

export default SelectNew;
