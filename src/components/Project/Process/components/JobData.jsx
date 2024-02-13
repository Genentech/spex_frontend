import React, { useCallback, useState } from 'react';
import {
  Button, DialogTitle, DialogContent, DialogContentText, DialogActions, Dialog,
} from '@material-ui/core';
import AssignmentIcon from '@material-ui/icons/Assignment';
import DownloadIcon from '@mui/icons-material/Download';
import PropTypes from 'prop-types';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useDispatch, useSelector } from 'react-redux';
import { actions as jobsActions, selectors as jobsSelectors } from '@/redux/modules/jobs';
import { statusFormatter } from '+utils/statusFormatter';
import Container from './ContainerJob';

const JobsData = ({ jobs }) => {
  const dispatch = useDispatch();
  const jobData = useSelector(jobsSelectors.getJobData);

  const handleAccordionExpand = useCallback(
    async (jobId) => {
      if (!jobData[jobId]) {
        await dispatch(jobsActions.fetchJobData(jobId));
      }
    },
    [dispatch, jobData],
  );

  const onDownload = useCallback(
    async (job_id) => {
      const fileName = `job_${job_id}.zip`;

      dispatch(jobsActions.downloadJob({ jobId: job_id, fileName }));
    },
    [dispatch],
  );

  const filteredJobs = Object.values(jobs).filter((job) => job.name === 'feature_extraction');

  const [openDialog, setOpenDialog] = useState(false);
  const handleClose = () => {
    setOpenDialog(false);
  };
  const handleLogClick = (task) => {
    handleAccordionExpand(task);
    setOpenDialog(true);
  };

  return (
    <Container>
      {filteredJobs.map((job, i) => (
        <div key={job.id}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: 10 }}>{`Job ${i + 1}: ${job.name}`}</span>
              <span style={{ fontWeight: 'bold' }}>{`Status: ${statusFormatter(job.status)}`}</span>
            </div>
            <div>
              <Button
                size="small"
                variant="contained"
                color="inherit"
                startIcon={<AssignmentIcon />}
                onClick={() => handleLogClick(job.id)}
              >
                Log
              </Button>
              <span style={{ marginRight: 10 }} />
              <Button
                size="small"
                variant="contained"
                color="inherit"
                startIcon={<DownloadIcon />}
                onClick={() => onDownload(job.id)}
              >
                zarr
              </Button>
            </div>
          </div>
          <Dialog
            open={openDialog}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogTitle id="alert-dialog-title">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: 10 }}>{`Job ${i + 1}: ${job.name}`}</span>
                <span style={{ fontWeight: 'bold' }}>{`Status: ${statusFormatter(job.status)}`}</span>
              </div>
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                {jobData[job.id] && <pre>{JSON.stringify(jobData[job.id], null, 2)}</pre>}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <CopyToClipboard text={JSON.stringify(jobData[job.id])}>
                <Button onClick={handleClose} color="primary" autoFocus>
                  Copy to Clipboard
                </Button>
              </CopyToClipboard>
            </DialogActions>
          </Dialog>
        </div>
      ))}
    </Container>

  );
};

JobsData.defaultProps = {
  jobs: {},
};

JobsData.propTypes = {
  jobs: PropTypes.objectOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      tasks: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        }),
      ),
      name: PropTypes.string.isRequired,
      status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    }),
  ),
};

export default JobsData;
