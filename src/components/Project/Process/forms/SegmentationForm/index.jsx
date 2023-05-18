/* eslint-disable react/jsx-sort-default-props */
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { actions as omeroActions, selectors as omeroSelectors } from '@/redux/modules/omero';
import { selectors as projectsSelectors } from '@/redux/modules/projects';

import {
  Field, Controls, Validators,
  Parsers, FormSpy, WhenFieldChanges,
} from '+components/Form';
import { propTypes, defaultProps } from '+components/FormModal';

import Form from '../../components/BlockSettingsForm';
import Col from './components/Col';
import Group from './components/Group';
import Row from './components/Row';

const SegmentationForm = styled((props) => {
  const {
    className,
    header,
    initialValues,
    onClose,
    onSubmit,
  } = props;

  const dispatch = useDispatch();

  const formRef = useRef(null);
  const [formValues, setFormValues] = useState(initialValues || {});

  const project = useSelector(projectsSelectors.getProject(formValues.projectId));
  const projectThumbnails = useSelector(omeroSelectors.getImagesThumbnails(formValues.projectId));
  const projectImages = useMemo(
    () => (Object.keys(projectThumbnails || {}).map((id) => ({ id, img: projectThumbnails[id] }))),
    [projectThumbnails],
  );
  const jobImages = useMemo(
    () => {
      if (!projectThumbnails) {
        return [];
      }
      return (initialValues?.omeroIds || []).filter((id) => projectThumbnails[id]).map((id) =>({ id, img: projectThumbnails[id] }));
    },
    [initialValues, projectThumbnails],
  );

  const imageDetails = useSelector(omeroSelectors.getImageDetails(formValues.omeroIds?.[0]?.id));

  const segmentationArea = useMemo(
    () => {
      if (!formValues?.content?.segment) {
        return null;
      }

      const val = [formValues.content.start, formValues.content.stop];
      if (val.filter((el) => el?.x >= 0 && el?.y >=0).length !== 2) {
        return null;
      }

      return val;
    },
    [formValues],
  );

  const onForm = useCallback(
    (form) => {
      formRef.current = form;
    },
    [],
  );

  const timer = useRef();
  const onFormChange = useCallback(
    ({ values }) => {
      timer.current = setTimeout(() => {
        setFormValues(values);
      }, 10);
    },
    [],
  );

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  const onAreaChange = useCallback(
    (area) => {
      const { current: form } = formRef;

      if (!area) {
        form.change('content.start', {});
        form.change('content.stop', {});
        return;
      }

      form.change('content.start', { x: area[0].x, y: area[0].y });
      form.change('content.stop', { x: area[1].x, y: area[1].y });
    },
    [],
  );

  useEffect(
    () => {
      if (!formValues.omeroIds?.length) {
        return;
      }
      const imageId = formValues.omeroIds[0].id || formValues.omeroIds[0];
      if (imageId) {
        dispatch(omeroActions.fetchImageDetails(imageId));
      }
      return () => {
        dispatch(omeroActions.clearImageDetails(imageId));
      };
    },
    [dispatch, formValues.omeroIds],
  );

  useEffect(
    () => {
      const projectImageIds = project?.omeroIds || [];
      if (projectImageIds.length) {
        dispatch(omeroActions.fetchImagesThumbnails({ groupId: formValues.projectId, imageIds: projectImageIds }));
      }
      return () => {
        dispatch(omeroActions.clearThumbnails(formValues.projectId));
      };
    },
    [dispatch, formValues.projectId, project?.omeroIds],
  );

  useEffect(
    () => () => {
      const { current: form } = formRef;
      form.restart();
    },
    [],
  );

  return (
    <Form
      className={className}
      header={header}
      initialValues={{
        ...initialValues,
        single: initialValues.single ?? jobImages.length <= 1,
        slices: initialValues.content.slice,
        omeroIds: jobImages,
      }}
      onForm={onForm}
      onClose={onClose}
      onSubmit={onSubmit}
    >
      <FormSpy
        subscription={{ values: true }}
        onChange={onFormChange}
      />

      <WhenFieldChanges
        field="single"
        becomes={true} //eslint-disable-line react/jsx-boolean-value
        set="omeroIds"
        to={formValues.omeroIds?.length > 1 ? [formValues.omeroIds[0]] : formValues.omeroIds}
      />

      <WhenFieldChanges
        field="slices"
        becomes={false}
        set="content.slice"
        to={undefined}
      />

      <WhenFieldChanges
        field="single"
        becomes={false}
        set="content.segment"
        to={false}
      />

      <WhenFieldChanges
        field="content.segment"
        becomes={false}
        set="content.start"
        to={undefined}
      />

      <WhenFieldChanges
        field="content.segment"
        becomes={false}
        set="content.stop"
        to={undefined}
      />

      <Col>
        <Group $label="Images" $height="100%">
          <Row>
            <Field
              name="single"
              formControlProps={{
                hiddenLabel: true, // not working
                className: 'hidden-label',
              }}
              component={Controls.Select}
              validate={Validators.required}
            >
              <Controls.SelectOption value={true}>One Image Mode</Controls.SelectOption> {/* eslint-disable-line react/jsx-boolean-value */}
              <Controls.SelectOption value={false}>Multi Images Mode</Controls.SelectOption>
            </Field>
          </Row>

          {formValues.single && (
            <Field
              name="omeroIds"
              label="Omero IDs"
              component={Controls.ImagePicker}
              editable={formValues?.content?.segment}
              area={segmentationArea}
              options={projectImages}
              validate={Validators.required}
              onAreaChange={onAreaChange}
            />
          )}

          {!formValues.single && (
            <Field
              name="omeroIds"
              label="Omero IDs"
              component={Controls.TransferList}
              options={projectImages}
              validate={Validators.required}
            />
          )}
        </Group>
      </Col>

      <Col $maxWidth="390px">
        <Group $label="Main" $disabled={formValues.omeroIds?.length === 0}>
          <Field
            name="content.c"
            label="Channel"
            component={Controls.Select}
            validate={Validators.requiredConditional('omeroIds')}
          >
            {imageDetails?.channels.map((el, i) => (
              <Controls.SelectOption key={`${el.color}_${el.label}`} value={i}>
                {`${i} ${el.label}`}
              </Controls.SelectOption>
            ))}
          </Field>

          <Field
            name="content.size"
            label="Size"
            component={Controls.TextField}
            InputProps={{
              inputProps: {
                type: 'number',
                min: 1, max: 25,
              },
            }}
            parse={(v) => Parsers.numberBetween(v, 1, 25)}
            validate={Validators.requiredConditional('omeroIds')}
          />
        </Group>

        <Group $label="Slices" $disabled={formValues.omeroIds?.length === 0}>
          <Row>
            <label>
              <Field
                name="slices"
                component={Controls.Checkbox}
                type="checkbox"
              />{' '}
              Cut Into Slices
            </label>
          </Row>

          <Row>
            <Field
              name="content.slice.x"
              label="Width"
              component={Controls.TextField}
              InputProps={{
                inputProps: {
                  type: 'number',
                  min: 1,
                  max: Math.round((imageDetails?.size?.width ?? Number.MAX_SAFE_INTEGER) / 2),
                },
              }}
              parse={(v) => Parsers.numberBetween(v, 1, Math.round((imageDetails?.size?.width ?? Number.MAX_SAFE_INTEGER) / 2))}
              validate={Validators.requiredConditional('slices')}
              disabled={!formValues.slices}
            />

            <Field
              name="content.slice.y"
              label="Height"
              component={Controls.TextField}
              InputProps={{
                inputProps: {
                  type: 'number',
                  min: 1,
                  max: Math.round((imageDetails?.size?.height ?? Number.MAX_SAFE_INTEGER) / 2),
                },
              }}
              parse={(v) => Parsers.numberBetween(v, 1, Math.round((imageDetails?.size?.height ?? Number.MAX_SAFE_INTEGER) / 2))}
              validate={Validators.requiredConditional('slices')}
              disabled={!formValues.slices}
            />

            <Field
              name="content.slice.margin"
              label="Margin"
              component={Controls.TextField}
              InputProps={{
                inputProps: {
                  type: 'number',
                  min: 15,
                  max: 100,
                },
              }}
              parse={(v) => Parsers.numberBetween(v, 15, 100)}
              validate={Validators.requiredConditional('slices')}
              disabled={!formValues.slices}
            />
          </Row>
        </Group>

        <Group $label="Segment" $disabled={!formValues.single || formValues.omeroIds?.length === 0}>
          <Row>
            <label>
              <Field
                name="content.segment"
                component={Controls.Checkbox}
                type="checkbox"
                disabled={!formValues.single}
              />{' '}
              Process One Segment Only
            </label>
          </Row>

          <Row>
            <Field
              name="content.start.x"
              label="StartX"
              component={Controls.TextField}
              InputProps={{
                inputProps: {
                  type: 'number',
                  min: 0,
                  max: imageDetails?.size?.width ?? Number.MAX_SAFE_INTEGER,
                },
              }}
              parse={(v) => Parsers.numberBetween(v, 0, imageDetails?.size?.width ?? Number.MAX_SAFE_INTEGER)}
              disabled={!formValues.content?.segment}
              validate={Validators.requiredConditional('content.segment')}
            />

            <Field
              name="content.start.y"
              label="StartY"
              component={Controls.TextField}
              InputProps={{
                inputProps: {
                  type: 'number',
                  min: 0,
                  max: imageDetails?.size?.height ?? Number.MAX_SAFE_INTEGER,
                },
              }}
              parse={(v) => Parsers.numberBetween(v, 0, imageDetails?.size?.height ?? Number.MAX_SAFE_INTEGER)}
              disabled={!formValues.content?.segment}
              validate={Validators.requiredConditional('content.segment')}
            />

            <Field
              name="content.stop.x"
              label="StopX"
              component={Controls.TextField}
              InputProps={{
                inputProps: {
                  type: 'number',
                  min: 0,
                  max: imageDetails?.size?.width ?? Number.MAX_SAFE_INTEGER,
                },
              }}
              parse={(v) => Parsers.numberBetween(v, 0, imageDetails?.size?.width ?? Number.MAX_SAFE_INTEGER)}
              disabled={!formValues.content?.segment}
              validate={Validators.requiredConditional('content.segment')}
            />

            <Field
              name="content.stop.y"
              label="StopY"
              component={Controls.TextField}
              InputProps={{
                inputProps: {
                  type: 'number',
                  min: 0,
                  max: imageDetails?.size?.height ?? Number.MAX_SAFE_INTEGER,
                },
              }}
              parse={(v) => Parsers.numberBetween(v, 0, imageDetails?.size?.height ?? Number.MAX_SAFE_INTEGER)}
              disabled={!formValues.content?.segment}
              validate={Validators.requiredConditional('content.segment')}
            />
          </Row>
        </Group>
      </Col>
    </Form>
  );
})`
  min-height: 600px;
  
  ${Col} + ${Col} {
    margin-left: 20px;
  }

  ${Row} + ${Row},
  ${Row} + ${Group},
  ${Group} + ${Row},
  ${Group} + ${Group},
  ${Row} + .MuiFormControl-root,
  ${Group} + .MuiFormControl-root,
  .MuiFormControl-root + ${Row},
  .MuiFormControl-root + ${Group} {
    margin-top: 20px;
  }

  .transfer-list,
  .image-picker {
    height: 100%;
    margin: 20px auto 0 auto;
  }

  label {
    white-space: nowrap;
  }
  
  .hidden-label {
    label {
      display: none;
    }
    label + .MuiInput-formControl {
      margin-top: unset;
    }
  }
`;

SegmentationForm.propTypes = propTypes;
SegmentationForm.defaultProps = defaultProps;

export default SegmentationForm;
