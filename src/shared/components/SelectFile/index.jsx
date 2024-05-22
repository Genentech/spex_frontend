import React, { useCallback, useState } from 'react';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '@material-ui/core/TextField';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { actions as fileActions } from '@/redux/modules/files';
import Button, { ButtonSizes, ButtonColors } from '+components/Button';

const FilePicker = ({ input, meta, onFileChange, ...tail }) => {
  const dispatch = useDispatch();
  const [selectedFile, setSelectedFile] = useState(null);

  const showError =
    ((meta.submitError && !meta.dirtySinceLastSubmit) || meta.error) && meta.touched;

  const onChange = input.onChange || tail.onChange;

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files[0];
      setSelectedFile(file);
    },
    [],
  );

  const handleUpload = useCallback(async () => {
    try {
      if (selectedFile) {
        onChange?.(selectedFile);
        if (typeof onFileChange === 'function') {
          onFileChange(selectedFile);
        }
        dispatch(fileActions.uploadFile(selectedFile));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }, [dispatch, selectedFile, onChange, onFileChange]);

  const renderInput = useCallback(() => {
    return (
      <React.Fragment>
        <input
          {...tail}
          type="file"
          id="file-picker-input"
          onChange={handleFileChange}
          accept=".h5ad, *"
          style={{ display: 'none' }}
        />

        <label
          htmlFor="file-picker-input"
          style={{ position: 'relative', cursor: 'pointer' }}
          onClick={(event) => {
            if (!selectedFile) {
              handleUpload();
              document.getElementById('file-picker-input').click();
            }
          }}
        >
          <TextField
            InputProps={{
              readOnly: true,
              value: selectedFile ? selectedFile.name : '',
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton edge="end" aria-label="select file" component="span">
                    <FolderOpenIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            helperText={showError ? meta.error || meta.submitError : undefined}
            error={showError}
            label={tail.label || 'Select'}
            variant="outlined"
            style={{ flexGrow: 1, transform: 'scaleY(0.80)' }}
          />
        </label>
      </React.Fragment>
    );
  }, [tail, showError, meta.error, meta.submitError, selectedFile, handleFileChange, handleUpload]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        {renderInput()}

        <Button
          size={ButtonSizes.medium}
          color={ButtonColors.primary}
          onClick={handleUpload}
          disabled={!selectedFile}
        >
          Upload
        </Button>
      </div>
    </div>
  );
};

FilePicker.propTypes = {
  input: PropTypes.shape({
    onChange: PropTypes.func,
  }),
  meta: PropTypes.shape({
    error: PropTypes.string,
    touched: PropTypes.bool,
    submitError: PropTypes.string,
    dirtySinceLastSubmit: PropTypes.bool,
  }),
  onChange: PropTypes.func,
  onFileChange: PropTypes.func,
};

FilePicker.defaultProps = {
  input: {},
  meta: {},
  onChange: null,
  onFileChange: null,
};

export default FilePicker;
