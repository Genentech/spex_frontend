/* eslint-disable react/jsx-sort-default-props */
import React, { Fragment, useMemo } from 'react';
import PropTypes from 'prop-types';

import Button, { ButtonColors } from '+components/Button';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '+components/Modal';

const ConfirmActions = {
  delete: 'delete',
  remove: 'remove',
};

const defaultHeaderTemplate = (action, item) => (<Fragment>{action} {item}</Fragment>);

const defaultBodyTemplate = (action, item) => (
  <Fragment>
    <div>Do you really want to <span>{action}</span> <span>{item ?? 'this item'}</span>? </div>

    <div>This process cannot be undone.</div>
  </Fragment>
);

/**
 * Confirm dialog.
 */
const ConfirmModal = (props) => {
  const {
    className,
    item,
    action,
    closeButtonText,
    open,
    headerTemplate,
    bodyTemplate,
    onClose,
    onSubmit,
  } = props;

  const header = useMemo(
    () => headerTemplate(action, item),
    [action, headerTemplate, item],
  );

  const body = useMemo(
    () => bodyTemplate(action, item),
    [action, bodyTemplate, item],
  );

  return (
    <Modal
      className={className}
      open={open}
      onClose={onClose}
    >
      <ModalHeader>{header}</ModalHeader>

      <ModalBody>{body}</ModalBody>

      <ModalFooter>
        <Button
          color={ButtonColors.secondary}
          onClick={onClose}
        >
          {closeButtonText}
        </Button>

        <Button
          color={ButtonColors.danger}
          onClick={onSubmit}
        >
          {action}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

ConfirmModal.propTypes = {
  /**
   * Override or extend the styles applied to the component.
   */
  className: PropTypes.string,
  /**
   * Action to confirm.
   */
  action: PropTypes.string,
  /**
   * Item to confirm action.
   */
  item: PropTypes.oneOfType([ PropTypes.string, PropTypes.object ]),
  /**
   * Text for the close button.
   */
  closeButtonText: PropTypes.string,
  /**
   * If true, the modal is open.
   */
  open: PropTypes.bool,
  /**
   * Header template function.
   */
  headerTemplate: PropTypes.func,
  /**
   * Text template function.
   */
  bodyTemplate: PropTypes.func,
  /**
   * Callback fired when the component requests to be closed. .
   */
  onClose: PropTypes.func,
  /**
   * A callback fired when confirm button clicked.
   */
  onSubmit: PropTypes.func,
};

ConfirmModal.defaultProps = {
  className: '',
  action: '',
  item: '',
  closeButtonText: 'Cancel',
  open: false,
  headerTemplate: defaultHeaderTemplate,
  bodyTemplate: defaultBodyTemplate,
  onClose: () => {},
  onSubmit: () => {},
};

export {
  ConfirmModal as default,
  ConfirmActions,
};
