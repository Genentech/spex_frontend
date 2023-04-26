/* eslint-disable react/jsx-sort-default-props */
import React, { useCallback, useMemo } from 'react';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import DynamicFeedOutlinedIcon from '@material-ui/icons/DynamicFeedOutlined';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import WallpaperIcon from '@material-ui/icons/Wallpaper';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { actions as tasksActions, selectors as tasksSelectors } from '@/redux/modules/tasks';
import Button from '+components/Button';
import FormModal from '+components/FormModal';
import { Box } from '+components/Tabs';
import Container from '@/components/Project/components/Container';

const ShowVisualizeModal = (props) => {
  const {
    className,
    header,
    initialValues,
    closeButtonText,
    submitButtonText,
    open,
    onClose,
    onSubmit,
  } = props;

  const dispatch = useDispatch();
  const images_visualization = useSelector(tasksSelectors.getTaskVisualizations);

  const onLoadVisualize = useCallback(
    () => {
      // dispatch(tasksActions.fetchTaskVisualize({ id, key: key }));
      initialValues.forEach((item) => {
        dispatch(tasksActions.fetchTaskVisualize({ id: item.id, name: item.name }));
      });
    },
    [dispatch, initialValues],
  );


  const images = useMemo(
    () => {
      if (images_visualization !== {}) {
        return [];
      }
      let data = [];
      Object.values(images_visualization).forEach((item) => {
        data.append(item);
      });
      return data;
    },

    [images_visualization],
  );



  return (
    <FormModal
      className={className}
      header={header}
      initialValues={initialValues}
      closeButtonText={closeButtonText}
      submitButtonText={submitButtonText}
      open={open}
      onClose={onClose}
      images={images}
      onSubmit={onSubmit}
    >
      <Accordion >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <DynamicFeedOutlinedIcon /> Tasks
        </AccordionSummary>
        <AccordionDetails>
          {/*{initialValues.map((item) => (*/}
          {/*  <ListItem component="div" key={item}>*/}
          {/*    <ListItemText*/}
          {/*      primary={`task id: ${item.id}.`}*/}
          {/*    />*/}
          {/*  </ListItem>*/}
          {/*))}*/}
          {Object.values(images_visualization).map((children) => (
            Object.keys(children).map((key) => (
              <Container key={Object.keys(children)[0]}>
                <Box
                  key={Object.keys(children)[0]}
                  component="img"
                  src={children[key]}
                  alt={key}
                />
              </Container>
            ))
          ))}
        </AccordionDetails>
      </Accordion>
      <Button
        size="small"
        variant="outlined"
        onClick={onLoadVisualize}
        startIcon={<WallpaperIcon />}
      >
        Render value
      </Button>
    </FormModal>
  );
};

ShowVisualizeModal.propTypes = {
  /**
   * Override or extend the styles applied to the component.
   */
  className: PropTypes.string,
  /**
   * Modal title.
   */
  header: PropTypes.string,
  /**
   * Initial values.
   */
  initialValues: PropTypes.shape([]),
  /**
   * Text for the close button.
   */
  closeButtonText: PropTypes.string,
  /**
   * Text for the confirm button.
   */
  submitButtonText: PropTypes.string,
  /**
   * If true, the modal is open.
   */
  open: PropTypes.bool,
  /**
   * Callback fired when the component requests to be closed.
   */
  onClose: PropTypes.func,
  /**
   * A callback fired when confirm button clicked.
   */
  onSubmit: PropTypes.func,
};

ShowVisualizeModal.defaultProps = {
  className: '',
  header: '',
  initialValues: [1, 2],
  closeButtonText: 'Cancel',
  submitButtonText: 'Submit',
  open: false,
  onClose: () => {},
  onSubmit: () => {},

};

export default ShowVisualizeModal;
