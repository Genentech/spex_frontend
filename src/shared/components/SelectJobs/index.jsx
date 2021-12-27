import React, { useMemo, useCallback, useEffect } from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { actions as jobsActions, selectors as jobsSelectors } from '@/redux/modules/jobs';

const Option = styled((props) => (
  <div className={props.className}>
    {props.label}
  </div>
))`
  :after {
    content: '---';
    margin-left: 10px;
    color: ${(props) => `#${props.$color}`} !important;
    background-color: ${(props) => `#${props.$color}`} !important;
  }
`;

const getOptionLabel = ({ label }) => label;

const SelectJobs = (props) => {
  const {
    projectId,
    pipelineId,
    input,
    meta,
    ...tail
  } = props;


  const showError = ((meta.submitError && !meta.dirtySinceLastSubmit) || meta.error) && meta.touched;
  const onChange = input.onChange || props.onChange;

  const dispatch = useDispatch();

  useEffect(
    () => {
      dispatch(jobsActions.fetchJobFeatureExtraction());

      return () => {
        dispatch(jobsActions.cancel());
        dispatch(jobsActions.clearJobFeatureExtraction());
      };
    },
    [dispatch],
  );

  const jobs_feature_extraction = useSelector(jobsSelectors.getJobsByParams());

  const options = useMemo(
    () => (Object.keys(jobs_feature_extraction) || []).map((el, i) => ({
      value: `${el}`,
      label: `${el}`,
    })),
    [jobs_feature_extraction],
  );

  const fixedValue = useMemo(
    () => {
      const value = input?.value || props.value || [];
      return (Array.isArray(value) ? value : [value])
        .map((val) => options.find((opt) => opt.label === val)
          || ({ value: val, label: val }));
    },
    [input?.value, options, props.value],
  );

  const doChange = useCallback(
    (_, val) => {
      onChange?.(val.map(getOptionLabel));
    },
    [onChange],
  );

  const renderItem = useCallback(
    (params) => (
      <TextField
        {...params}
        helperText={showError ? meta.error || meta.submitError : undefined}
        error={showError}
      />
    ),
    [showError, meta.error, meta.submitError],
  );

  return (
    <Autocomplete
      {...tail}
      renderInput={renderItem}
      getOptionLabel={getOptionLabel}
      renderOption={Option}
      options={options}
      value={fixedValue}
      onChange={doChange}
      multiple
    />
  );
};

SelectJobs.propTypes = {
  projectId: PropTypes.string,
  pipelineId: PropTypes.string,
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
};

SelectJobs.defaultProps = {
  projectId: '',
  pipelineId: '',
  input: {},
  meta: {},
  value: null,
  onChange: null,
};

export default SelectJobs;
