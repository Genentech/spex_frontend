import React, { useState, useEffect } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const TaskInfoModal = (props) => {
  const {
    header,
    infoText,
    open,
    onClose,
  } = props;

  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    setOpenDialog(open);
  }, [open]);

  return (
    <Dialog
      open={openDialog}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{header}</DialogTitle>
      <DialogContent>
        <div id="alert-dialog-description">
          {infoText}
        </div>
      </DialogContent>
      <DialogActions>
        <CopyToClipboard text={infoText}>
          <Button onClick={onClose} color="primary" autoFocus>
            Copy to Clipboard
          </Button>
        </CopyToClipboard>
      </DialogActions>
    </Dialog>
  );
};

TaskInfoModal.propTypes = {
  header: PropTypes.string.isRequired,
  infoText: PropTypes.node.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default TaskInfoModal;
