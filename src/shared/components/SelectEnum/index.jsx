import React, { useMemo, useCallback } from 'react';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import Select from '@material-ui/core/Select';
import PropTypes from 'prop-types';

const SelectEnum = (props) => {
  const {
    options,
    value,
    onChange,
    input,
    label,
  } = props;

  const fixedValue = useMemo(
    () => options.find((opt) => opt.label === (value || input?.value))?.value || '',
    [value, input?.value, options],
  );

  const doChange = useCallback((event) => {
    const selectedOption = options.find((opt) => opt.value === event.target.value);
    const newLabel = selectedOption ? selectedOption.label : null;

    if (input?.onChange) {
      input.onChange(newLabel);
    } else {
      onChange?.(newLabel);
    }
  }, [options, input, onChange]);

  return (
    <FormControl variant="outlined">
      <InputLabel htmlFor="select-enum">{label}</InputLabel>
      <Select
        value={fixedValue}
        onChange={doChange}
        input={
          <OutlinedInput label={label} notched={Boolean(label)} id="select-enum" />
        }
      >
        {options.map(({ value, label }) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

SelectEnum.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  input: PropTypes.shape({
    value: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.arrayOf(PropTypes.number),
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string),
    ]),
    onChange: PropTypes.func,
  }),
  onChange: PropTypes.func,
  label: PropTypes.string,
};

SelectEnum.defaultProps = {
  value: null,
  onChange: null,
  input: {},
  label: null,
};

export default SelectEnum;
