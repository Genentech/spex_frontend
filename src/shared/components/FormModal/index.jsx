/* eslint-disable react/jsx-sort-default-props */
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import Button, { ButtonColors } from '+components/Button';
import Form, { FormRenderer } from '+components/Form';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '+components/Modal';

/**
 * Form modal dialog.
 */
const FormModal = styled((props) => {
  const {
    className,
    header,
    children,
    initialValues,
    closeButtonText,
    submitButtonText,
    open,
    modalProps,
    hideSubmitButton,
    onClose,
    onSubmit,
    onForm,
    ...tail
  } = props;

  const render = useCallback(
    ({ handleSubmit, form, submitting }) => {
      if (onForm) {
        onForm(form);
      }

      return (
        <Modal
          {...modalProps}
          className={className}
          open={open}
          onClose={(event) => {
              form.restart();
              onClose(event);
          }}
        >
          <FormRenderer
            onSubmit={(event) => {
              // eslint-disable-next-line promise/catch-or-return,promise/prefer-await-to-then
              handleSubmit(event)?.then(() => form.restart());
            }}
          >
            <ModalHeader>{header}</ModalHeader>

            <ModalBody>{children}</ModalBody>

            <ModalFooter>
              <Button
                color={ButtonColors.secondary}
                onClick={(event) => {
                  form.restart();
                  onClose(event);
                }}
              >
                {closeButtonText}
              </Button>

              {!hideSubmitButton && (
                <Button
                  type="submit"
                  color={ButtonColors.primary}
                  disabled={submitting}
                >
                  {submitButtonText}
                </Button>
              )}
            </ModalFooter>
          </FormRenderer>
        </Modal>
      );
      },
    [onForm, modalProps, className, open, header, children, closeButtonText, hideSubmitButton, submitButtonText, onClose],
  );

  return (
    <Form
      {...tail}
      mutators={{
        setValue: ([field, value], state, { changeValue }) => {
          changeValue(state, field, () => value);
        },
      }}
      initialValues={initialValues}
      render={render}
      onSubmit={onSubmit}
    />
  );
})`
  ${ModalBody} {
    .MuiFormControl-root ~ .MuiFormControl-root {
      margin-top: 14px;
    }
  }
`;

const propTypes = {
  /**
   * Override or extend the styles applied to the component.
   */
  className: PropTypes.string,
  /**
   * Modal title.
   */
  header: PropTypes.string,
  /**
   * Form fields.
   */
  children: PropTypes.oneOfType([ PropTypes.node, PropTypes.object, PropTypes.func ]),
  /**
   * Initial values.
   */
  initialValues: PropTypes.shape({}),
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
   * Modal props.
   */
  modalProps: PropTypes.shape({}),
  /**
   * If true, submit button will be hidden.
   */
  hideSubmitButton: PropTypes.bool,
  /**
   * Callback fired when the component requests to be closed. .
   */
  onClose: PropTypes.func,
  /**
   * A callback fired when confirm button clicked.
   */
  onSubmit: PropTypes.func,
};

const defaultProps = {
  className: '',
  header: '',
  children: null,
  initialValues: null,
  closeButtonText: 'Cancel',
  submitButtonText: 'Submit',
  open: false,
  modalProps: null,
  hideSubmitButton: false,
  onClose: () => {},
  onSubmit: () => {},
};

FormModal.propTypes = propTypes;
FormModal.defaultProps = defaultProps;

export {
  FormModal as default,
  propTypes,
  defaultProps,
};
