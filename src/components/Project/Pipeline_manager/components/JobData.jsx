import React, { useCallback } from 'react';
import {
  Accordion,
  ListItemText,
  AccordionSummary,
  AccordionDetails,
  Button,
  Grid,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { actions as jobsActions, selectors as jobsSelectors } from '@/redux/modules/jobs';
import { statusFormatter } from '+utils/statusFormatter';
import Container from './Container';

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

  return (
    <Container>
      {filteredJobs.map((job, i) => (
        <Accordion key={job.id} onChange={() => handleAccordionExpand(job.id)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <ListItemText
              primary={`Job ${i + 1}: ${job.name}`}
              secondary={`Status: ${statusFormatter(job.status)}`}
            />
            <Button variant="contained" color="primary" onClick={() => onDownload(job.id)}>
              Download ann data
            </Button>
          </AccordionSummary>
          <AccordionDetails>
            {jobData[job.id] && <pre>{JSON.stringify(jobData[job.id], null, 2)}</pre>}
          </AccordionDetails>
        </Accordion>
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
