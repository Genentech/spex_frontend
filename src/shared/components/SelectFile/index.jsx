import React, { useCallback, useState, useEffect, useRef } from 'react';
import { actions as fileActions, selectors as fileSelectors } from '@/redux/modules/files';
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
    const ref = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [reset, setReset] = useState(false);

    const isFetching = useSelector(fileSelectors.isFetching);

    useEffect(() => {
        if (!isFetching && selectedFile && reset) {
            setSelectedFile(null);
            setReset(false);
        }
    },[isFetching, selectedFile, reset]);

    const showError =
        ((meta.submitError && !meta.dirtySinceLastSubmit) || meta.error) && meta.touched;

    const onChange = input.onChange || tail.onChange;

    const handleFileChange =
        (e) => {
            const file = e.target.files[0];
            setSelectedFile(file);
        };

    const handleUpload = useCallback(async () => {
        try {
            if (selectedFile) {
                onChange?.(selectedFile);
                if (typeof onFileChange === 'function') {
                    onFileChange(selectedFile);
                }
                dispatch(fileActions.uploadFile(selectedFile));
                setReset(true);
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
        }
    }, [dispatch, selectedFile, onChange, onFileChange]);

    const openFileDialog = () => {
        ref.current.value = '';
        ref.current.click();
    };

    const renderInput = useCallback(() => {
        return (
          <React.Fragment>
            <input
              {...tail}
              type="file"
              ref={ref}
              onChange={handleFileChange}
              accept=".h5ad, .tiff, *"
              style={{ display: 'none' }}
            />


            <TextField
              InputProps={{
                        readOnly: true,
                        value: selectedFile ? selectedFile.name : '',
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              edge="end"
                              aria-label="select file"
                              component="span"
                              onClick={openFileDialog}
                              disabled={!!isFetching}
                            >
                              <FolderOpenIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
              }}
              disabled={!!isFetching}
              helperText={showError ? meta.error || meta.submitError : undefined}
              error={showError}
              label={tail.label || 'Select'}
              variant="outlined"
              style={{ maxWidth: '50%', flexGrow: 0, transform: 'scaleY(0.80)' }}
            />
          </React.Fragment>
        );
    }, [tail, ref, selectedFile, openFileDialog, isFetching, showError, meta.error, meta.submitError]);

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          {renderInput()}

          <Button
            size={ButtonSizes.medium}
            color={ButtonColors.primary}
            onClick={handleUpload}
            disabled={isFetching || !selectedFile}
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

