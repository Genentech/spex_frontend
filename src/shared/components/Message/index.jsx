import React from 'react';
import PropTypes from 'prop-types';

const Message = ({ message }) => {
  const messageStyles = {
    fontSize: '14px',
    fontWeight: 'bold',
    padding: '8px',
    margin: '8px 0',
    borderRadius: '4px',
    textAlign: 'right',
  };

  return (
    <div style={messageStyles}>
      {message}
    </div>
  );
};

Message.propTypes = {
  message: PropTypes.string.isRequired,
};

export default Message;
