import React, { useMemo, useCallback, useEffect } from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { matchPath, useLocation } from 'react-router-dom';
import PathNames from '@/models/PathNames';
import { actions as jobsActions, selectors as jobsSelectors } from '@/redux/modules/jobs';

const getOptionLabel = (option) => option.label;

const renderOption = (option) => (
  <div key={getOptionLabel(option)}>
    {getOptionLabel(option)}
  </div>
);

const SelectJobsPipeline = (props) => {
  let {
    projectId,
    pipelineId,
    input,
    meta,
    ...tail
  } = props;

  const location = useLocation();
  const showError = ((meta.submitError && !meta.dirtySinceLastSubmit) || meta.error) && meta.touched;
  const onChange = input.onChange || props.onChange;

  const dispatch = useDispatch();

  const matchProjectPath = matchPath(location.pathname, { path: `/${PathNames.projects}/:id` });
  projectId = matchProjectPath ? matchProjectPath.params.id : undefined;

  const matchPipelinePath = matchPath(location.pathname, {
    path: `/${PathNames.projects}/${projectId}/${PathNames.pipelines}/:id`,
  });
  pipelineId = matchPipelinePath ? matchPipelinePath.params.id : undefined;

  useEffect(
    () => {
      dispatch(jobsActions.fetchJobZscore( pipelineId ));

      return () => {
        dispatch(jobsActions.cancel());
        dispatch(jobsActions.clearJobZScore());
      };
    },
    [dispatch, pipelineId],
  );

  const jobs = useSelector(jobsSelectors.getJobsByPipeline(pipelineId));
  const onlyOneValue = true;

  const options = useMemo(
    () => {
      let return_val = [];
      (Object.keys(jobs) || []).forEach((el) => {
        return_val.push({ value: `${jobs[el].tasks[0].id}`, label: `${jobs[el].tasks[0].id} ${jobs[el].name}` });
      });
      return return_val;
    },
    [jobs],
  );

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
        if (val) {
          onChange?.(onlyOneValue ? val?.value : val?.map((el) => el.value));
        };
    },
    [onlyOneValue, onChange],
  );

  const renderItem = useCallback(
    (params) => (
      <TextField
        {...params}
        helperText={showError ? meta.error || meta.submitError : undefined}
        error={showError}
        label={tail.label || ''}
        variant="outlined"
      />
    ),
    [tail.label, showError, meta.error, meta.submitError],
  );

  return (
    <Autocomplete
      {...tail}
      renderInput={renderItem}
      getOptionLabel={getOptionLabel}
      renderOption={renderOption}
      options={options}
      value={fixedValue}
      onChange={doChange}
    />
  );
};

SelectJobsPipeline.propTypes = {
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

SelectJobsPipeline.defaultProps = {
  projectId: '',
  pipelineId: '',
  input: {},
  meta: {},
  value: null,
  onChange: null,
};

export default SelectJobsPipeline;
